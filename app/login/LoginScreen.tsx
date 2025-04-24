import React, { useState, useEffect } from 'react';
import { View, Button, ActivityIndicator, Text, StyleSheet, ScrollView } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { googleAuthConfig } from '../../config/authConfig';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [emails, setEmails] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const redirectUri = "https://auth.expo.io/@madisomchik/smm-app"; // Replace with your redirect URI

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleAuthConfig.webClientId,
      redirectUri,
      scopes: [
        'openid',
        'profile',
        'email',
        'https://www.googleapis.com/auth/gmail.readonly',
      ],
      responseType: 'code',
      usePKCE: true,
    },
    discovery
  );

  useEffect(() => {
    const handleAuthCode = async () => {
      if (response?.type === 'success' && response.params.code) {
        try {
          setLoading(true);
          const tokens = await exchangeCodeAsync(response.params.code);
          if (tokens.access_token) {
            await AsyncStorage.setItem('access_token', tokens.access_token);
            fetchUser(tokens.access_token);
            fetchEmails(tokens.access_token);
            router.replace('/dashboard/App');
          }
        } catch (e: any) {
          console.error(e);
          setError('Authentication failed');
        } finally {
          setLoading(false);
        }
      }
    };

    handleAuthCode();
  }, [response]);

  const exchangeCodeAsync = async (code: string) => {
    const body = new URLSearchParams({
      client_id: googleAuthConfig.webClientId,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: request?.codeVerifier || '',
    });

    const res = await fetch(discovery.tokenEndpoint!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) {
      throw new Error('Failed to exchange token');
    }

    return await res.json();
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    await promptAsync();
    setLoading(false);
  };

  const fetchUser = async (accessToken: string) => {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const user = await res.json();
    setUserInfo(user);
  };

  const fetchEmails = async (accessToken: string) => {
    const res = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const { messages } = await res.json();

    if (!messages) return;

    const details = await Promise.all(
      messages.map((msg: any) =>
        fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        ).then(r => r.json())
      )
    );

    setEmails(details);
  };

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" />}
      {error && <Text style={styles.error}>{error}</Text>}

      {!userInfo && !loading && (
        <Button title="Login with Google" onPress={handleGoogleLogin} disabled={!request} />
      )}

      {userInfo && (
        <ScrollView>
          <Text style={styles.title}>Welcome, {userInfo.name}</Text>
          <Text>{userInfo.email}</Text>
          <Text style={styles.section}>Recent Emails:</Text>
          {emails.map((email, idx) => (
            <View key={idx} style={styles.emailCard}>
              <Text style={styles.subject}>
                {email.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '(No Subject)'}
              </Text>
              <Text style={styles.snippet}>{email.snippet}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  section: { marginTop: 16, fontSize: 16, fontWeight: '600' },
  emailCard: { backgroundColor: '#eee', padding: 12, marginVertical: 6, borderRadius: 8 },
  subject: { fontWeight: 'bold' },
  snippet: { color: '#555' },
  error: { color: 'red', marginBottom: 10 },
});

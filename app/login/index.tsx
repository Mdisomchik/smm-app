import React, { useState, useEffect } from 'react';
import { View, Text, Button, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { googleAuthConfig } from '../../config/authConfig';

export default async function LoginScreen() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const redirectUri = 'https://auth.expo.io/@madisomchik/smm-app';

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleAuthConfig.webClientId,
      scopes: googleAuthConfig.scopes,
      redirectUri,
    });

    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
    };

    await request.makeAuthUrlAsync(discovery);

    const result = await request.promptAsync(discovery);

    if (result.type === 'success' && result.authentication?.accessToken) {
      const accessToken = result.authentication.accessToken;

      await AsyncStorage.setItem('access_token', accessToken);
      await fetchUserInfo(accessToken);
      await fetchEmails(accessToken); // Fetch the emails once the access token is retrieved

      setRedirecting(false);
      router.replace('/dashboard'); 
    } else {
      console.log('Login canceled or failed:', result);
      setRedirecting(false);
    }

    setLoading(false);
  };

  const fetchUserInfo = async (accessToken: string) => {
    const res = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const user = await res.json();
    setUserInfo(user);
  };

  const fetchEmails = async (accessToken: string) => {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (data.messages) {
      const emailDetails = await Promise.all(
        data.messages.map((msg: { id: string }) => fetchEmailDetails(msg.id, accessToken))
      );
      setEmails(emailDetails);
    }
  };

  const fetchEmailDetails = async (id: string, accessToken: string) => {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const message = await res.json();
    const subjectHeader = message.payload.headers.find((h: any) => h.name === 'Subject');
    return {
      id: message.id,
      subject: subjectHeader ? subjectHeader.value : '(No Subject)',
      snippet: message.snippet,
    };
  };

  return (
    <View style={styles.container}>
      {redirecting && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Redirecting, please wait...</Text>
        </View>
      )}
      {!redirecting && !userInfo && !loading && (
        <Button title="Sign in with Google" onPress={handleGoogleLogin} />
      )}
      {userInfo && (
        <ScrollView>
          <Text style={styles.text}>Welcome {userInfo.name} 👋</Text>
          <Text style={styles.email}>{userInfo.email}</Text>
          <Text style={styles.sectionTitle}>Your Emails:</Text>
          {emails.length > 0 ? (
            emails.map((email) => (
              <View key={email.id} style={styles.emailCard}>
                <Text style={styles.subject}>{email.subject}</Text>
                <Text style={styles.snippet}>{email.snippet}</Text>
              </View>
            ))
          ) : (
            <Text>No emails found.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  text: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  email: { fontSize: 14, marginBottom: 10, color: '#555' },
  sectionTitle: { marginTop: 20, fontSize: 16, fontWeight: '600' },
  emailCard: {
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
  },
  subject: { fontWeight: 'bold', fontSize: 15 },
  snippet: { fontSize: 13, color: '#444' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: { marginTop: 10, fontSize: 16 },
});

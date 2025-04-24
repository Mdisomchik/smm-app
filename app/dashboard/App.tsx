import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Dashboard() {
  const [emails, setEmails] = useState<any[]>([]);

  useEffect(() => {
    const fetchEmails = async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      const res = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { messages } = await res.json();
      const details = await Promise.all(
        messages.map((msg: any) =>
          fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(res => res.json())
        )
      );
      setEmails(details);
    };

    fetchEmails();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Emails:</Text>
      {emails.map((email, index) => (
        <View key={index} style={styles.emailCard}>
          <Text style={styles.subject}>
            {email.payload?.headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)'}
          </Text>
          <Text style={styles.snippet}>{email.snippet}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  emailCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  subject: { fontWeight: 'bold' },
  snippet: { color: '#666' },
});

import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { colors, s } from '../ui';

export default function DashboardScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setStats(await api.getDashboard()); setError(''); } catch (e) { setError(e.message); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const cards = stats && [
    ['Commodities', stats.commodities, colors.blue],
    ['With HSN code', stats.withHsn, '#12b76a'],
    ['Deduction enabled', stats.deductionEnabled, colors.purple],
    ['Hamali enabled', stats.hamaliEnabled, '#f79009'],
  ];

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.pad}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}>
      <Text style={s.title}>Welcome back, {user.fullName || user.username}</Text>
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
        {cards && cards.map(([label, value, color]) => (
          <View key={label} style={[s.card, { width: '47%', borderLeftWidth: 4, borderLeftColor: color }]}>
            <Text style={s.muted}>{label}</Text>
            <Text style={{ fontSize: 30, fontWeight: '700', color: colors.ink }}>{value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

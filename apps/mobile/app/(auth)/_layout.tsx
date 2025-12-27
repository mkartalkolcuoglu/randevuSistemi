import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="business-login" />
      <Stack.Screen name="customer-login" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="select-tenant" />
    </Stack>
  );
}

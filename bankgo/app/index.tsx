import { Redirect } from 'expo-router';

/**
 * Ruta raíz `/` — redirige inmediatamente al grupo de auth.
 * El AuthGuard en _layout.tsx se encarga de la lógica real:
 * si hay sesión activa, redirige a /(app)/dashboard.
 * Si no, la redirección a /(auth)/login ya está cubierta por este Redirect.
 */
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}

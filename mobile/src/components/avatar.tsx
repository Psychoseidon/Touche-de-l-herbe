import { Image, StyleSheet, View, type ViewProps } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export function Avatar({
  size = 40,
  style,
  children,
}: ViewProps & { size?: number }) {
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        style as object,
      ]}>
      {children}
    </View>
  );
}

export function AvatarImage({ uri }: { uri: string | null | undefined }) {
  if (!uri) return null;
  return <Image source={{ uri }} style={StyleSheet.absoluteFill} />;
}

export function AvatarFallback({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[StyleSheet.absoluteFill, styles.fallback, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold">{children}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

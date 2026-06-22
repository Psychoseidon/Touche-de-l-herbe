import { StyleSheet, type ViewProps } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export function Card({ style, ...rest }: ViewProps) {
  const theme = useTheme();
  return (
    <ThemedView
      style={[styles.base, { borderColor: theme.backgroundSelected }, style as object]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 14,
  },
});

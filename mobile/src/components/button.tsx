import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';
import { ThemedText } from '@/components/themed-text';

type ButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'outline';
  loading?: boolean;
};

const ACCENT = '#3c87f7';

export function Button({ label, variant = 'primary', loading, disabled, style, ...rest }: ButtonProps) {
  const isOutline = variant === 'outline';

  return (
    <Pressable
      disabled={disabled || loading}
      style={[
        styles.base,
        isOutline ? styles.outline : styles.primary,
        (disabled || loading) && styles.disabled,
        style as object,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={isOutline ? ACCENT : '#fff'} />
      ) : (
        <ThemedText style={isOutline ? styles.outlineText : styles.primaryText}>{label}</ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: ACCENT,
  },
  outline: {
    borderWidth: 1,
    borderColor: ACCENT,
  },
  disabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
  },
  outlineText: {
    color: ACCENT,
    fontWeight: '600',
  },
});

export const AccentColor = ACCENT;

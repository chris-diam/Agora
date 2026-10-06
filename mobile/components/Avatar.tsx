import { Image, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { resolveMediaUrl } from "../lib/api";

interface AvatarProps {
  name: string;
  imageUrl: string | null | undefined;
  size?: number;
}

// Mirrors frontend/src/components/Avatar.tsx's fallback-initial behavior —
// a missing or broken image shows the name's first letter on a solid fill
// instead of a blank box or a native broken-image glyph.
export function Avatar({ name, imageUrl, size = 36 }: AvatarProps) {
  const { colors } = useTheme();
  const resolvedUrl = resolveMediaUrl(imageUrl);
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (!resolvedUrl) {
    return (
      <View style={[{ backgroundColor: colors.agora, alignItems: "center", justifyContent: "center" }, dimension]}>
        <Text style={{ color: colors.agoraOn, fontWeight: "700", fontSize: size * 0.42 }}>
          {name.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }

  return <Image source={{ uri: resolvedUrl }} style={dimension} />;
}

export default function CustomImage({ src, alt = "", style }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{
        maxWidth: "100%",
        height: "auto",
        borderRadius: 12,
        display: "block",
        ...style,
      }}
    />
  );
}

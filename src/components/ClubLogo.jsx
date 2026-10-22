// The Zemer F.C. crest (public/logo.webp, a 384px cut-out with a transparent background).
const LOGO_URL = `${import.meta.env.BASE_URL}logo.webp`;

export default function ClubLogo({ alt = 'Zemer F.C.', ...props }) {
  return <img src={LOGO_URL} alt={alt} draggable={false} {...props} />;
}

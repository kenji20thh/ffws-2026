import { countryFlagUrl } from "@/lib/flags";

type FlagProps = {
  country?: string | null;
  className?: string;
  /** Height in px (number) or any CSS length; width follows the aspect ratio. */
  height?: number | string;
};

/**
 * Renders a country flag from flagcdn.com (works in browsers that don't
 * render flag emojis). Renders nothing if the country is unknown.
 */
export default function Flag({ country, className = "", height = 16 }: FlagProps) {
  if (!country) return null;

  const url = countryFlagUrl(country);
  if (!url) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={country}
      title={country}
      loading="lazy"
      style={{ height, width: "auto" }}
      className={`inline-block shrink-0 object-contain align-middle ${className}`}
    />
  );
}
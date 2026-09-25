import Image from "next/image"; import Link from "next/link";
export default function Logo() {
  return (<Link href="/" className="flex items-center gap-2" aria-label="FFWS World Cup home">
    <Image src="/logo/ffws-mark.svg" alt="" width={24} height={24} />
    <span className="font-display text-xl tracking-wide">FFWS <span className="text-accent">WORLD CUP</span></span></Link>);
}

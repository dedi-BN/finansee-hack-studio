import { CHIP_CLASS, domainTone } from "../lib/domainTone";

export default function DomainChip({ domain }: { domain: string }) {
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${CHIP_CLASS[domainTone(domain)]}`}
    >
      {domain}
    </span>
  );
}

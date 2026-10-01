"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { ApiError, createFantasyTeam } from "@/lib/api";
import { COUNTRY_FLAGS, countryFlag } from "@/lib/flags";

export default function CreateFantasyTeamForm({
  tournamentId,
  onCreated,
}: {
  tournamentId: number;
  onCreated: () => void;
}) {
  const [teamName, setTeamName] = useState("");
  const [country, setCountry] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const countryRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const countries = Object.keys(COUNTRY_FLAGS);

  const filteredCountries = countries.filter((name) =>
    name.toLowerCase().includes(countrySearch.toLowerCase().trim()),
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        countryRef.current &&
        !countryRef.current.contains(event.target as Node)
      ) {
        setCountryOpen(false);
        setCountrySearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (countryOpen) {
      requestAnimationFrame(() => {
        searchRef.current?.focus();
      });
    }
  }, [countryOpen]);

  function selectCountry(name: string) {
    setCountry(name);
    setCountrySearch("");
    setCountryOpen(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!country) {
      setError("Please select a country");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await createFantasyTeam(tournamentId, teamName, country);
      onCreated();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? err.message
          : "Failed to create fantasy team",
      );
    } finally {
      setBusy(false);
    }
  }

  const input =
    "chamfer-sm w-full border border-bone/20 bg-char-2 px-4 py-3 font-stat text-sm text-bone focus:border-ember focus:outline-none";

  return (
    <form
      onSubmit={onSubmit}
      className="chamfer mx-auto w-full max-w-md space-y-4 border border-bone/10 bg-char-2 p-6"
    >
      <p className="font-stat text-[11px] uppercase tracking-[0.3em] text-ember">
        Build your squad
      </p>

      <h1 className="font-display text-4xl font-black uppercase leading-none">
        Create fantasy team
      </h1>

      <div>
        <label htmlFor="tn" className="sr-only">
          Team name
        </label>

        <input
          id="tn"
          className={input}
          placeholder="Team name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          required
          minLength={2}
        />
      </div>

      <div ref={countryRef} className="relative">
        <label htmlFor="country-search" className="sr-only">
          Country
        </label>

        <button
          type="button"
          onClick={() => {
            setCountryOpen((open) => !open);
            setCountrySearch("");
          }}
          className={`${input} flex items-center justify-between text-left`}
          aria-haspopup="listbox"
          aria-expanded={countryOpen}
        >
          {country ? (
            <span className="flex items-center gap-2">
              <span className="text-lg">{countryFlag(country)}</span>
              <span>{country}</span>
            </span>
          ) : (
            <span className="text-bone/50">Select country</span>
          )}

          <span
            className={`text-bone/50 transition-transform ${
              countryOpen ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        </button>

        {countryOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 border border-bone/20 bg-char-2 shadow-xl">
            <div className="border-b border-bone/10 p-2">
              <input
                ref={searchRef}
                id="country-search"
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setCountryOpen(false);
                    setCountrySearch("");
                  }

                  if (e.key === "Enter" && filteredCountries.length === 1) {
                    e.preventDefault();
                    selectCountry(filteredCountries[0]);
                  }
                }}
                placeholder="Search country..."
                autoComplete="off"
                className="w-full border border-bone/20 bg-char px-3 py-2 font-stat text-sm text-bone placeholder:text-bone/40 focus:border-ember focus:outline-none"
              />
            </div>

            <div
              className="max-h-60 overflow-y-auto"
              role="listbox"
              aria-label="Countries"
            >
              {filteredCountries.length > 0 ? (
                filteredCountries.map((name) => (
                  <button
                    key={name}
                    type="button"
                    role="option"
                    aria-selected={country === name}
                    onClick={() => selectCountry(name)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left font-stat text-sm transition-colors hover:bg-bone/10 ${
                      country === name
                        ? "bg-ember/10 text-ember"
                        : "text-bone"
                    }`}
                  >
                    <span className="w-6 text-lg">
                      {countryFlag(name)}
                    </span>

                    <span>{name}</span>
                  </button>
                ))
              ) : (
                <p className="px-4 py-4 font-stat text-xs text-bone/50">
                  No countries found
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <p
        aria-live="polite"
        className="min-h-5 font-stat text-xs text-danger"
      >
        {error}
      </p>

      <Button
        type="submit"
        disabled={busy}
        className="w-full"
      >
        {busy ? "Creating…" : "Create team"}
      </Button>
    </form>
  );
}
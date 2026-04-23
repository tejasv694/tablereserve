"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const POLICIES = {
  en: ({ restaurantName, contactEmail }) => (
    <>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Privacy Policy</h1>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">1. Data Controller</h2>
        <p className="leading-relaxed text-gray-700">
          The data controller for the personal data collected through this booking system is{" "}
          <strong>{restaurantName}</strong>. You can reach us at{" "}
          <a href={`mailto:${contactEmail}`} className="text-blue-600 underline">
            {contactEmail}
          </a>.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">2. What Data We Collect</h2>
        <p className="leading-relaxed text-gray-700">
          When you make a reservation, we collect the following personal data:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
          <li>Full name</li>
          <li>Email address</li>
          <li>Phone number (optional)</li>
          <li>Reservation details (date, time, party size, special requests)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">3. Why We Collect It</h2>
        <p className="leading-relaxed text-gray-700">
          Your personal data is collected solely to manage your restaurant reservation, including
          sending you a booking confirmation and any necessary updates about your reservation.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">4. Legal Basis</h2>
        <p className="leading-relaxed text-gray-700">
          The legal basis for processing your data is <strong>Article 6(1)(b) GDPR</strong> —
          processing is necessary for the performance of a contract (your reservation).
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">5. Data Retention</h2>
        <p className="leading-relaxed text-gray-700">
          Your personal data is stored for <strong>30 days after your visit</strong>. After this
          period, all personal data is automatically and permanently deleted from our systems.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">6. Right to Early Deletion</h2>
        <p className="leading-relaxed text-gray-700">
          You may request early deletion of your data at any time by contacting us at{" "}
          <a href={`mailto:${contactEmail}`} className="text-blue-600 underline">
            {contactEmail}
          </a>.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">7. Third Parties</h2>
        <p className="leading-relaxed text-gray-700">
          Your personal data is not shared with any third parties outside the European Union.
          We use a transactional email service to send booking confirmations, which processes
          data within the EU.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">8. Your Rights</h2>
        <p className="leading-relaxed text-gray-700">Under the GDPR, you have the right to:</p>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
          <li>Access the personal data we hold about you</li>
          <li>Rectify any inaccurate data</li>
          <li>Erase your data (right to be forgotten)</li>
          <li>Lodge a complaint with your local supervisory authority (Datenschutzbehörde)</li>
        </ul>
        <p className="mt-2 leading-relaxed text-gray-700">
          To exercise any of these rights, please contact{" "}
          <a href={`mailto:${contactEmail}`} className="text-blue-600 underline">
            {contactEmail}
          </a>.
        </p>
      </section>

      <section className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">9. Technical Data Processor</h2>
        <p className="leading-relaxed text-gray-700">
          This booking platform is operated as a technical data processor on behalf of the restaurant.
          The platform operator processes data exclusively under the instructions of the restaurant
          and in accordance with applicable data protection regulations.
        </p>
      </section>
    </>
  ),
  de: ({ restaurantName, contactEmail }) => (
    <>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Datenschutzerklärung</h1>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">1. Verantwortlicher</h2>
        <p className="leading-relaxed text-gray-700">
          Verantwortlich für die Verarbeitung der über dieses Buchungssystem erhobenen
          personenbezogenen Daten ist <strong>{restaurantName}</strong>. Sie erreichen uns unter{" "}
          <a href={`mailto:${contactEmail}`} className="text-blue-600 underline">
            {contactEmail}
          </a>.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">2. Welche Daten wir erheben</h2>
        <p className="leading-relaxed text-gray-700">
          Bei einer Reservierung erheben wir folgende personenbezogene Daten:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
          <li>Vollständiger Name</li>
          <li>E-Mail-Adresse</li>
          <li>Telefonnummer (optional)</li>
          <li>Reservierungsdetails (Datum, Uhrzeit, Personenanzahl, besondere Wünsche)</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">3. Zweck der Datenerhebung</h2>
        <p className="leading-relaxed text-gray-700">
          Ihre personenbezogenen Daten werden ausschließlich zur Verwaltung Ihrer
          Restaurantreservierung erhoben, einschließlich der Zusendung einer Buchungsbestätigung
          und notwendiger Aktualisierungen zu Ihrer Reservierung.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">4. Rechtsgrundlage</h2>
        <p className="leading-relaxed text-gray-700">
          Die Rechtsgrundlage für die Verarbeitung Ihrer Daten ist{" "}
          <strong>Art. 6 Abs. 1 lit. b DSGVO</strong> — die Verarbeitung ist zur Erfüllung
          eines Vertrags (Ihrer Reservierung) erforderlich.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">5. Speicherdauer</h2>
        <p className="leading-relaxed text-gray-700">
          Ihre personenbezogenen Daten werden <strong>30 Tage nach Ihrem Besuch</strong>{" "}
          gespeichert. Nach Ablauf dieser Frist werden alle personenbezogenen Daten automatisch
          und dauerhaft aus unseren Systemen gelöscht.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">6. Recht auf vorzeitige Löschung</h2>
        <p className="leading-relaxed text-gray-700">
          Sie können jederzeit die vorzeitige Löschung Ihrer Daten beantragen, indem Sie uns unter{" "}
          <a href={`mailto:${contactEmail}`} className="text-blue-600 underline">
            {contactEmail}
          </a>{" "}
          kontaktieren.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">7. Dritte</h2>
        <p className="leading-relaxed text-gray-700">
          Ihre personenbezogenen Daten werden nicht an Dritte außerhalb der Europäischen Union
          weitergegeben. Wir nutzen einen transaktionalen E-Mail-Dienst für den Versand von
          Buchungsbestätigungen, der Daten innerhalb der EU verarbeitet.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">8. Ihre Rechte</h2>
        <p className="leading-relaxed text-gray-700">
          Gemäß der DSGVO haben Sie das Recht auf:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
          <li>Auskunft über die bei uns gespeicherten personenbezogenen Daten</li>
          <li>Berichtigung unrichtiger Daten</li>
          <li>Löschung Ihrer Daten (Recht auf Vergessenwerden)</li>
          <li>Beschwerde bei der zuständigen Aufsichtsbehörde (Datenschutzbehörde)</li>
        </ul>
        <p className="mt-2 leading-relaxed text-gray-700">
          Zur Ausübung dieser Rechte wenden Sie sich bitte an{" "}
          <a href={`mailto:${contactEmail}`} className="text-blue-600 underline">
            {contactEmail}
          </a>.
        </p>
      </section>

      <section className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          9. Technischer Auftragsverarbeiter
        </h2>
        <p className="leading-relaxed text-gray-700">
          Diese Buchungsplattform wird als technischer Auftragsverarbeiter im Auftrag des
          Restaurants betrieben. Der Plattformbetreiber verarbeitet Daten ausschließlich nach
          Weisung des Restaurants und unter Einhaltung der geltenden Datenschutzbestimmungen.
        </p>
      </section>
    </>
  ),
};

export default function PrivacyPolicyContent({ restaurantName, contactEmail, defaultLocale }) {
  const [locale, setLocale] = useState(defaultLocale === "de" ? "de" : "en");

  const PolicyComponent = POLICIES[locale];

  return (
    <div>
      <div className="mb-8 flex justify-end gap-2">
        <Button
          variant={locale === "en" ? "default" : "outline"}
          size="sm"
          onClick={() => setLocale("en")}
        >
          English
        </Button>
        <Button
          variant={locale === "de" ? "default" : "outline"}
          size="sm"
          onClick={() => setLocale("de")}
        >
          Deutsch
        </Button>
      </div>

      <PolicyComponent restaurantName={restaurantName} contactEmail={contactEmail} />

      <p className="mt-12 text-center text-xs text-gray-400">
        Last updated: {new Date().toLocaleDateString(locale === "de" ? "de-DE" : "en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
    </div>
  );
}

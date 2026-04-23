import { getPrismaClient } from "@/lib/tenant";
import { notFound } from "next/navigation";
import PrivacyPolicyContent from "./PrivacyPolicyContent";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const prisma = getPrismaClient(slug);
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { name: true },
  });

  if (!restaurant) return { title: "Privacy Policy" };

  return {
    title: `Privacy Policy — ${restaurant.name}`,
  };
}

export default async function PrivacyPolicyPage({ params }) {
  const { slug } = await params;
  const prisma = getPrismaClient(slug);

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      name: true,
      contactEmail: true,
      locale: true,
    },
  });

  if (!restaurant) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <PrivacyPolicyContent
          restaurantName={restaurant.name}
          contactEmail={restaurant.contactEmail || "info@restaurant.com"}
          defaultLocale={restaurant.locale || "en"}
        />
      </div>
    </main>
  );
}

import { getEntry } from "@/lib/cookies";
import CheckInScreen from "@/components/features/checkin/CheckInScreen";

export const dynamic = "force-dynamic";

const salonName = process.env.NEXT_PUBLIC_SALON_NAME || "Nail Salon";

const HomePage = async ({ searchParams }) => {
  const { expired } = await searchParams;
  const entry = await getEntry();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-8">
      <h1 className="mb-6 text-center text-3xl font-bold text-pink-700">{salonName}</h1>
      <CheckInScreen hasEntry={Boolean(entry)} expired={expired === "1"} />
    </main>
  );
};

export default HomePage;

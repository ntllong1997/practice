import { isStaff } from "@/lib/staff";
import PinLogin from "@/components/ui/PinLogin";
import QrDisplay from "@/components/features/qr/QrDisplay";

export const dynamic = "force-dynamic";
export const metadata = { title: "Check-in QR" };

const QrPage = async () => {
  if (!(await isStaff())) return <PinLogin title="Front-desk QR screen" />;
  return <QrDisplay salonName={process.env.NEXT_PUBLIC_SALON_NAME || "Nail Salon"} />;
};

export default QrPage;

"use client";

import { useState } from "react";
import { useLastTicket } from "@/hooks/useLastTicket";
import CheckInForm from "./CheckInForm";
import ScanPrompt from "./ScanPrompt";
import TicketView from "./TicketView";

const CheckInScreen = ({ hasEntry, expired }) => {
  const { ticket, saveTicket, isReady } = useLastTicket();
  const [canCheckIn, setCanCheckIn] = useState(hasEntry);
  const [isViewingTicket, setIsViewingTicket] = useState(false);

  if (!isReady) return null;

  const handleCheckedIn = (newTicket) => {
    saveTicket(newTicket);
    setCanCheckIn(false);
  };

  if (canCheckIn && !isViewingTicket) {
    return (
      <>
        <CheckInForm onCheckedIn={handleCheckedIn} onScanNeeded={() => setCanCheckIn(false)} />
        {ticket && (
          <button
            type="button"
            onClick={() => setIsViewingTicket(true)}
            className="mt-6 text-center text-pink-700 underline"
          >
            View my ticket #{ticket.ticket_number}
          </button>
        )}
      </>
    );
  }

  if (ticket) {
    return (
      <TicketView
        ticket={ticket}
        onNewCheckIn={canCheckIn ? () => setIsViewingTicket(false) : null}
      />
    );
  }

  return <ScanPrompt expired={expired} />;
};

export default CheckInScreen;

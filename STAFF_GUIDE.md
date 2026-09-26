# Staff Guide – Check-in & Dashboard

## One-time setup: print the QR code

1. On a computer or phone, open **`https://<your-site>/qr`** and enter the **staff PIN**.
2. Tap **🖨️ Print** and put the printed QR code at the front desk.
3. That's it. The same code works every day. (You only need to print a new one if the owner changes `SALON_SECRET`.)

## How customers check in

1. Customer scans the QR code with their phone camera.
2. They type their name (optional), tap the services they want (listed under **Pedicure** and **Nails**) → **Check in**.
3. Their phone shows a big number like **#7**. Remind them to **take a screenshot**.
4. One scan = one check-in. Checking in another person (e.g. a friend) needs another scan.
5. A copied link won't work. The customer just needs to scan the printed code.

## Technician dashboard

Open **`https://<your-site>/dashboard`** (add it to your home screen). Enter the staff PIN once per device.

- Customers are listed **in check-in order**. The lowest number goes first.
- **Start a service:** tap it (e.g. *Deluxe Pedicure*). The card turns **red**.
- **Finish a service:** tap the same service again. It's marked *Done ✓*.
  - If the customer still has another service waiting, the card turns **green** with a **Priority** badge. Take this customer next for their remaining service.
  - When all their services are done, the card turns **blue** and moves to **Completed**.
- **Tapped by mistake?** Tap a *Done* service and confirm **Undo**. It goes back to waiting.
- **Customer left / no-show:** tap **Cancel / no-show** and confirm. They're removed and everyone behind them moves up.
- If two people tap the same service at the same moment, only the first tap counts.

### Edit the service menu

On the dashboard tap **Services** (or open `/dashboard/services`).

- **Add:** type the name in the Pedicure or Nails box → **Add**. It shows on the check-in page right away.
- **Rename:** tap **Rename**, change the name → **Save**.
- **Remove:** tap **Remove** and confirm. Customers can't pick it any more; customers already checked in keep it on their card.

### Color cheat sheet

| Card color | Meaning |
|---|---|
| White | Waiting – nothing started |
| 🔴 Red | Service in progress |
| 🟢 Green | One service done, another still waiting (**priority**) |
| 🔵 Blue | All services done |

## Good to know

- **"I was number 5"**: check the customer's screenshot against the card number.
- Numbers **restart at #1 every day**. Yesterday's list disappears from the dashboard (it's still saved).
- The dashboard updates by itself every few seconds on every device.

## Troubleshooting

- **Screen not updating:** reload the page.
- **Asked for the PIN again:** the owner probably changed the PIN. Enter the new one.
- **"Too many wrong tries":** wait 15 minutes, then try again.
- **Forgot the PIN:** the owner can set a new one (see README → *Change the staff PIN*).

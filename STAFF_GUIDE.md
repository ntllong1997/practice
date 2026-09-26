# Staff Guide – Check-in & Dashboard

## Every morning (front desk)

1. On the front-desk tablet, open **`https://<your-site>/qr`**.
2. First time only: enter the **staff PIN**.
3. Leave it on the screen, plugged in, with auto-lock turned off. The QR code changes every minute by itself.

## How customers check in

1. Customer scans the QR code with their phone camera.
2. They type their name (optional) and tap **Pedicure**, **Nails**, or both → **Check in**.
3. Their phone shows a big number like **#7**. Remind them to **take a screenshot**.
4. One scan = one check-in. Checking in another person (e.g. a friend) needs another scan.
5. An old or shared link won't work. The customer just needs to scan the code on the screen again.

## Technician dashboard

Open **`https://<your-site>/dashboard`** (add it to your home screen). Enter the staff PIN once per device.

- Customers are listed **in check-in order**. The lowest number goes first.
- **Start a service:** tap it (e.g. *Pedicure*). The card turns **red**.
- **Finish a service:** tap the same service again. It's marked *Done ✓*.
  - If the customer still has another service waiting, the card turns **green** with a **Priority** badge. Take this customer next for their remaining service.
  - When all their services are done, the card turns **blue** and moves to **Completed**.
- **Tapped by mistake?** Tap a *Done* service and confirm **Undo**. It goes back to waiting.
- **Customer left / no-show:** tap **Cancel / no-show** and confirm. They're removed and everyone behind them moves up.
- If two people tap the same service at the same moment, only the first tap counts.

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

# NorthWind Banking Challenge

A small responsive banking application built with SvelteKit 4 and TypeScript using Array's provided starter repository, Figma design, and NorthWind API.

## Features

- View account names, numbers, balances, and statuses
- Visually distinguish unavailable accounts
- Transfer funds between active accounts
- Validate account selections, transfer amounts, and available balances
- Display loading, error, success, and empty states
- Show recent transfers from the API and recent activity from documented mock data
- Support desktop and mobile layouts

## Run locally

1. Make sure Node.js and npm are installed.
2. Copy `.env.example` to `.env`.
3. Replace `[API_Key]` in `.env` with the provided NorthWind API key.
4. Make sure another application is not using port `5173`. Stop it first if necessary.
5. Install the dependencies:

```sh
npm install
```

6. Start the application:

```sh
npm run dev
```

Open `http://localhost:5173`.

## Test and verify

Run the unit tests:

```sh
npm test
```

Run the remaining project checks:

```sh
npm run check
npm run lint
npm run build
```

## Assumptions

- `account_holder_name` is displayed as the account name because the account response does not provide a separate descriptive-name field.
- Any account status other than `active` is treated as `inactive` and is disabled in transfer dropdowns.
- A successful response from `POST /external/transfers/initiate` is treated as a successful submission, including a `PENDING` transfer. The success receipt is then displayed.
- After a successful submission, the confirmed transfer amount is immediately applied to the shared account store. A later full-page reload fetches the latest balances from the API.
- Transfer requests use `OUTBOUND` for direction, `ACH` for transfer type, `Internal account transfer` for the description, and a generated UUID-based reference number because these required values are not represented in the UI.
- The Figma Recent Activity examples are used as mock data because the API does not provide purchases, deposits, or interest activity. Recent transfers use live API data.
- The amount field is labeled `Transfer amount` because the Figma label `Transfer to` duplicates the destination-account label.
- UI pagination is not included because it is not required by the challenge or shown in the design. The account request uses the API maximum of 100 records.
- The transfer form validates that:

A source account is selected.
A destination account is selected.
The source and destination accounts are different.
The transfer amount is greater than zero.
The transfer amount does not exceed the available source-account balance.

- No additional transfer-limit rule is enforced because no explicit transfer threshold was provided in the API documentation or requirements.

## Architecture decisions

- The Accounts view uses `/`, and the transfer view uses `/balance-transfer`. Separate routes keep navigation and direct links clear without adding unnecessary routing complexity.
- Browser requests go through SvelteKit server endpoints. This keeps the API key out of client-side code and provides one place for request validation and API error handling.
- NorthWind responses are treated as untrusted data and explicitly parsed into TypeScript application types at the server boundary.
- Transfer rules are validated in the browser for immediate feedback and again on the server before the NorthWind request is sent.
- A small Svelte account store shares balances between the Accounts and Balance Transfer routes. Form, loading, and error state remain local to the page where they are used.
- Native form controls and semantic HTML are used for keyboard support, labeling, focus behavior, and screen-reader compatibility.
- The Transfer Summary acts as the pre-submission review. `Complete transfer` submits directly to match the Figma flow, and the API result is shown as a receipt-style success or error state.
- Styling uses plain CSS, the provided variables, and responsive media queries without a component or styling framework.
- Unit tests focus on transfer validation and NorthWind API boundaries because they contain the highest-risk business and integration behavior.
  -Visual and responsive behavior was verified manually. One limitation I identified is the native dropdown experience on some mobile and tablet screen sizes, where the opened menu does not align as closely with the select control as I would prefer. I considered replacing it with a custom select component or introducing a third-party library, but decided against making that change late in the implementation due to the added complexity, accessibility considerations, and risk of losing reliable native browser behavior. Given the scope of the assignment, I chose to retain the native select and document this as an area for future refinement.
- The account selection dropdown displays the account name, account type, balance, and whether the account is active/available. I chose to include this information so users have enough context to clearly understand which accounts they are transferring between before making a selection. I also found that transfers from a CD account to checking or savings accounts are not permitted by the API. In those cases, I surface the error message returned by the API rather than introducing additional client-side assumptions around transfer eligibility. I matched the implementation to the provided Figma designs as closely as possible within the scope of the assignment. With additional time and deeper design review, there would likely be further opportunities to refine spacing, sizing, and other CSS details, but the current implementation prioritizes functional accuracy, responsiveness, and consistency with the provided design direction.
  -After a successful transfer, the application's account state is updated so that the Accounts page reflects the new balances immediately. This keeps the UI consistent with the assignment requirement to update account balances without requiring the user to manually reload the application. If the API response provides updated account information, that response is treated as the source of truth. Otherwise, the local account state is updated using the completed transfer amount.
-

## API endpoints

- `GET /external/accounts`
- `GET /external/transfers`
- `POST /external/transfers/initiate`

The API key is read only by the SvelteKit server and should never be committed to the repository.

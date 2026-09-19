# Architecture Decisions and Assumptions

This document records the decisions and assumptions made while implementing the Array NorthWind engineering challenge. It supplements the README and explains how gaps or differences between the challenge requirements, API contract, and Figma designs were handled.

## Architecture decisions

### Application routes

- `/` displays the Accounts view.
- `/balance-transfer` displays the Balance Transfer view.

Separate routes provide clear navigation and direct links while keeping the application structure small. The challenge allows either routes or conditional rendering.

### NorthWind API integration

Browser requests are sent to SvelteKit server endpoints, which then communicate with NorthWind. This keeps the API key out of client-side code and centralizes authentication, response parsing, and error handling.

NorthWind responses are treated as untrusted data. Response values are checked and converted into explicit TypeScript application types before they are returned to the UI.

### State management

A small Svelte store holds the account collection because balances are shared between the Accounts and Balance Transfer routes. After a successful transfer submission, the confirmed amount is applied to the store immediately. Returning to the Accounts route therefore displays the updated balances even when NorthWind still reports the transfer as pending.

Form fields, loading indicators, errors, transfer history, and result state remain local to the page where they are used. Reusable presentation is separated into a small number of components, including the application shell, account list, activity list, and transfer result card.

### Transfer validation

Transfer rules are validated in two places:

- In the browser for immediate feedback and button-state control.
- On the server before the NorthWind transfer request is sent.

Server validation remains necessary because browser validation can be bypassed by calling the application endpoint directly.

The Complete transfer button is enabled only when:

- Both accounts are selected and active.
- The accounts are different.
- The amount is a finite number greater than zero.
- The amount does not exceed the source account's available balance.
- A transfer is not already being submitted.

### Transfer interaction

The Transfer Summary serves as the pre-submission review, so no additional review page or confirmation modal is used. Complete transfer submits directly, matching the primary Figma flow. A successful response displays a receipt-style confirmation, while a failed response displays a user-visible error state.

Native `<select>` elements are retained for keyboard and assistive-technology support. A styled visual layer presents the selected account name and its available balance on two lines, matching the Figma design. The native control remains responsible for selection behavior.

The chevron animation uses the CSS `:open` state as a progressive enhancement. Browsers that do not support the selector retain a static chevron without affecting the control's functionality.

### Balance presentation

The Transfer Summary has three states:

1. Before account selection, it displays From and To with placeholder dashes.
2. After accounts are selected but before a valid amount is entered, it displays each account's Current balance.
3. After a valid amount is entered, it displays New balance values. The amount is deducted from the source account and added to the destination account.

After a successful transfer submission, the store deducts the confirmed amount from the source account and adds it to the destination account. This deliberate optimistic update is used because the initiate response can be successful while a subsequent accounts request still contains pre-transfer balances. A full-page reload retrieves the latest source-of-truth balances from the API.

### Styling and responsiveness

The application uses the provided CSS variables and plain CSS. No component library, Tailwind, or additional styling framework is included.

The desktop layout uses two columns for the primary content and supporting panels. At mobile widths, the layout becomes a single column while retaining the content order and spacing shown in Figma.

### Testing strategy

Automated tests focus on the highest-risk behavior:

- Transfer validation rules.
- Successful API parsing.
- Malformed API responses.
- API error propagation.
- Successful and failed transfer submissions.
- Balance refresh behavior.

Visual appearance, responsive layout, keyboard navigation, loading states, and result screens are verified manually. This provides meaningful coverage without introducing a large component-testing setup for a two-day assignment.

## Design and implementation assumptions

### Account display name

The account response does not include a separate descriptive account-name field. `account_holder_name` is therefore used as the displayed account name, while `account_type` is displayed separately where appropriate.

### Account status

Only `active` accounts are selectable for transfers. All other statuses, including `frozen`, `closed`, `inactive`, and unknown values, are treated as unavailable. They remain visible in the dropdown but are disabled.

### Transfer endpoint

`POST /external/transfers/initiate` is used for the balance-transfer feature because it is the available endpoint that initiates a transfer, even though it is grouped under the API's external-transfer endpoints.

Required request fields that are not represented in the UI use the following values:

- `direction`: `OUTBOUND`
- `transfer_type`: `ACH`
- `description`: `Internal account transfer`
- `reference_number`: a generated UUID-based reference

### Successful transfer status

An HTTP success response from the initiate endpoint is treated as a successful submission, including when the returned transfer status is `PENDING`. The success receipt is displayed immediately and the account list is refreshed. Transfer-status polling is not implemented because it is not required by the challenge or represented in the design.

### Transaction-limit failures

The Figma error state references an exceeded transaction limit, but the API documentation does not define a frontend threshold. Transaction limits are therefore treated as API-enforced business rules, and the application displays the error message returned by the API rather than inventing a client-side limit.

### Transfer amount label

The amount input is labeled Transfer amount. The selected Figma frame labels it Transfer to, which duplicates the destination-account label and is treated as a copy error.

### Button state inconsistency

One mobile Figma frame shows Complete transfer enabled while the amount is empty or zero. The button remains disabled in the implementation because an empty or zero amount is invalid and the challenge explicitly requires frontend validation.

### Current and new balance states

Some Figma frames show Current balances while another shows New balance values. These are treated as different form states rather than conflicting designs: Current is shown after account selection, and New balance is shown after the transfer amount becomes valid.

### Recent Activity

The API does not provide purchases, deposits, or interest activity. The Recent Activity panel uses the sample entries shown in Figma and is documented as mock data. Recent transfers are loaded from the NorthWind transfer endpoint.

### Pagination

UI pagination is not included because it is not required by the challenge or shown in Figma. The account request uses the API's maximum page size of 100 records.

## Intentionally out of scope

- Account card/list view switching
- UI pagination
- Transfer-status polling
- A separate pre-submit review page or confirmation modal
- A custom JavaScript combobox
- Frontend transaction-limit rules not defined by the API

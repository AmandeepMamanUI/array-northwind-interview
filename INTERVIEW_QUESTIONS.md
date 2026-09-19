# Array Challenge Interview Questions

This guide covers likely follow-up questions about the NorthWind banking application. The answers are intentionally concise and should be explained naturally rather than memorized word for word.

## One-minute project overview

I built a responsive SvelteKit 4 and TypeScript application with an Accounts view and a Balance Transfer view. The browser communicates with SvelteKit server endpoints, which protect the API key and handle the NorthWind integration. API responses are treated as untrusted data and explicitly parsed into application types. Transfer rules are validated in both the browser and server, successful transfers refresh account balances, and failures produce visible feedback. I followed the supplied Figma designs using plain CSS and the provided variables, documented assumptions where the API and design differed, and added focused Vitest coverage for validation and API behavior.

## Architecture and structure

### 1. Why did you use separate routes instead of conditional rendering?

The challenge allowed either approach. I used `/` for Accounts and `/balance-transfer` for Transfers because separate URLs provide clearer navigation, browser history, refresh behavior, and direct linking without adding much complexity.

### 2. Why did you use a Svelte store?

Account balances are shared between the Accounts and Balance Transfer routes. A small account store lets a successful transfer update the balances once and makes those values immediately available when the user returns to Accounts. Form fields, loading indicators, errors, and result state remain local because they do not need to be shared.

### 3. How did you separate concerns?

The project separates:

- Client API calls from UI components.
- Server-side NorthWind integration from browser code.
- Type definitions from response parsing.
- Transfer validation from form rendering.
- Reusable presentation into focused components.

This keeps API details, business rules, and visual concerns from being mixed together.

### 4. Why are NorthWind requests made through SvelteKit endpoints?

The proxy keeps the API key on the server, prevents it from appearing in browser code or network requests to NorthWind, and provides one boundary for authentication, response parsing, validation, and error handling.

### 5. Is the application safe to scale horizontally?

The server endpoints are stateless. They do not store user sessions or transfer state in process memory, so multiple application instances can handle requests independently. Production deployment would still require appropriate infrastructure configuration, observability, and NorthWind rate-limit handling.

## TypeScript and API handling

### 6. How did you treat API data as untrusted?

Fetch responses begin as `unknown`. The server verifies that expected objects, arrays, strings, and finite numbers exist before creating typed `Account`, `TransferSummary`, or `TransferReceipt` values. Invalid data results in a controlled error rather than being passed directly into the UI.

### 7. Why not cast the fetch response directly to an interface?

A TypeScript cast only changes what the compiler believes; it does not validate runtime data. Explicit parsing prevents malformed or unexpected API responses from silently entering the application.

### 8. How are network and parsing errors handled?

Network failures, unreadable JSON, non-success HTTP responses, and malformed successful responses are handled separately. The server converts them into consistent status and message values, and the UI displays an appropriate loading, retry, or error state.

### 9. Why use a custom `NorthwindError`?

It carries both an HTTP status and a message through the integration layer. The route handlers can then return consistent errors without depending on untyped thrown values.

### 10. How did you protect the API key?

The key is read from a private server environment variable. It is never imported into client code. `.env` is excluded from Git, while `.env.example` documents the required variable with a placeholder.

## Transfer behavior

### 11. Why validate transfers in both the browser and server?

Browser validation gives immediate feedback and prevents normal invalid submissions. Server validation protects the actual endpoint because browser controls can be bypassed through direct HTTP requests or modified client code.

### 12. Which transfer rules are enforced?

Both accounts must exist, be active, and be different. The amount must be finite and greater than zero, and it cannot exceed the source account's available balance.

### 13. Why keep inactive accounts visible in the dropdown?

The assignment specifically asks for inactive accounts to be listed but not selectable. Showing them explains that the accounts exist while disabled options prevent invalid selection.

### 14. How do you prevent selecting the same account twice?

The selected source account is disabled in the destination options, and the selected destination is disabled in the source options. The validation function also rejects matching account numbers as a second layer of protection.

### 15. Why did you remove the separate review screen?

The challenge requires confirmation after success, not an additional pre-submit page. The Figma Transfer Summary already gives the user a review of the selected accounts, amount, and projected balances. Direct submission keeps the interaction aligned with the design and avoids an undocumented step.

### 16. How are projected balances calculated?

When the transfer is valid, the amount is subtracted from the source balance and added to the destination balance. Before a valid amount is present, the summary shows current balances instead of projected values.

### 17. What happens after a successful transfer?

The UI displays a receipt-style confirmation, resets the form state, and immediately applies the confirmed transfer to the shared account store. This ensures the Accounts route shows the new amounts even when NorthWind still reports the transfer as pending and returns pre-transfer balances. A full-page reload reconciles the store with the API.

### 18. How do you prevent duplicate submissions?

The submitting state disables the button while the request is in progress. The submission handler also checks that the form remains valid before sending the request.

### 19. Why is a `PENDING` response treated as success?

The challenge says a successful response should show confirmation, reset the form, and update balances. Because no polling requirement or completed-status workflow is provided, an HTTP success from the initiate endpoint is treated as a successful submission. This assumption is documented.

### 20. Why did you not implement the transaction-limit error in frontend validation?

The Figma shows that error, but no limit is documented. Inventing a threshold could conflict with the real business rule. The API is treated as the source of truth, and its returned error message is displayed to the user.

## Svelte and reactivity

### 21. What does `$:` mean in this project?

In Svelte 4, `$:` declares a reactive statement. Svelte reruns it when one of the referenced variables changes. It is used for derived values such as the transfer input, validation errors, selected accounts, button state, and projected balances.

### 22. Why update the store with a new array instead of mutating it?

The account store uses `update()` and `map()` to return a new array. Immutable updates make the balance change predictable, preserve the original account objects, and ensure Svelte subscribers receive the new value.

### 23. What does `bind:value` do?

It creates two-way binding between a form control and a Svelte variable. When the user changes the input, the variable updates; when the variable is reset after success, the control updates as well.

### 24. Why use `on:submit|preventDefault` instead of a button click handler?

Handling the form's submit event supports mouse clicks and keyboard submission. `preventDefault` stops the browser navigation while preserving normal form semantics.

### 25. Why is `onMount` used?

The accounts and transfers are loaded when the page becomes active in the browser. `onMount` starts that initial asynchronous loading workflow.

## Design and accessibility

### 26. How did you handle differences between Figma and the requirements?

Functional requirements take priority over inconsistent visual states. For example, one mobile frame shows an enabled button with an empty amount, but the implementation keeps it disabled because the challenge requires frontend validation. These choices are documented.

### 27. Why is the amount field labeled “Transfer amount”?

The Figma label says “Transfer to,” which duplicates the destination-account label. I treated that as a copy error and used the clearer, semantically correct label.

### 28. How did you preserve select accessibility while matching the two-line design?

The native select remains the interactive control for keyboard and assistive-technology behavior. A non-interactive visual layer displays the selected account and available balance on separate lines. This avoids implementing a complex custom combobox.

### 29. What accessibility details did you include?

The forms use associated labels, semantic controls, keyboard-submittable forms, visible focus states, disabled options, `aria-invalid`, `aria-describedby`, live loading messages, and alert roles for errors. Decorative images have empty alternative text.

### 30. How did you make the layout responsive?

The desktop view uses a two-column grid. A media query changes it to a single-column layout on mobile, adjusts shell and panel spacing, and preserves the content order shown in Figma.

### 31. Why use plain CSS instead of a component library?

The assignment specifically requests plain CSS or the existing SCSS setup and prohibits component libraries and styling frameworks. I reused the supplied variables for consistent spacing, colors, typography, borders, and radii.

## Testing and quality

### 32. What did you test automatically?

Vitest covers the transfer rules, successful account parsing, malformed responses, API errors, successful transfer submission, failed transfer submission, and refreshed balances.

### 33. Why did you not write a test for every function or page?

Tests were prioritized by risk. Financial validation and API boundaries contain the most important behavior. Testing every formatting helper or adding a large component-testing setup would provide less value within the two-day scope.

### 34. What did you test manually?

I verified desktop and mobile layouts, keyboard navigation, focus states, active and inactive options, loading and error states, button enablement, successful and failed transfers, direct route navigation, and API-key isolation.

### 35. What project checks did you run?

I ran:

```sh
npm test
npm run check
npm run lint
npm run build
```

## Tradeoffs and future improvements

### 36. What would you improve with more time?

I would add component-level accessibility tests, end-to-end transfer tests, production telemetry, and confirmed status polling if the API contract required it. I would also replace Figma-only activity data if a real transaction-history endpoint became available.

### 37. Why did you not implement pagination?

Pagination is not required by the challenge or shown in Figma. The request uses the API maximum of 100 accounts. For a larger production dataset, I would add server-backed pagination based on product requirements.

### 38. Why is Recent Activity mocked?

The design includes purchases, deposits, and interest entries, but the API does not expose that information. The challenge allows mock data when no feasible endpoint exists, so I used the Figma examples and documented them. Recent transfers still come from the API.

### 39. What was the most important tradeoff?

The main tradeoff was balancing production-minded behavior with the two-day scope. I prioritized secure API integration, runtime validation, transfer correctness, accessibility, error handling, responsive design, and focused tests while avoiding unsupported features and unnecessary architecture.

### 40. What decision would you reconsider if requirements changed?

If account state needed persistence across browser sessions or synchronization across tabs, I would move beyond the current in-memory store and define a server-backed caching and reconciliation strategy. If transfers remained pending for a meaningful period, I would add a status endpoint workflow and define how pending, completed, and failed states affect balances and receipts.

## Questions to ask the interviewers

- In the production application, would transfer initiation count as completion for the UI, or would the client track a pending status?
- Are account balances updated synchronously after initiation?
- Is there a transaction-history endpoint that was intentionally excluded from the challenge API?
- How does Array normally divide runtime schema validation between its API clients and backend services?
- What testing level does the team prioritize for Svelte components: unit, integration, or end-to-end?

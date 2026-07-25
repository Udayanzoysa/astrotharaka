# Customer API

All routes require `Authorization: Bearer <accessToken>`.

## Users

### GET `/users/me`

Returns the authenticated user and profile.

### PATCH `/users/me/profile`

Update profile fields: `fullName`, `mobileNumber`, `whatsappNumber`, `preferredLanguage`, `country`, `emailMarketingConsent`, `whatsappMarketingConsent`.

## Birth Profiles

### POST `/birth-profiles`

Create birth profile. Enqueues astrology calculation job.

### GET `/birth-profiles`

List own birth profiles (includes `accuracyWarning` when unknown birth time).

### GET `/birth-profiles/:id`

### PATCH `/birth-profiles/:id`

### DELETE `/birth-profiles/:id`

## Products

### GET `/products`

### GET `/products/:slug`

## Orders

### POST `/orders`

Body includes `productId`, `birthProfileId`, optional `language`, optional `promoCode`.

### GET `/orders`

### GET `/orders/:id`

### POST `/orders/:id/payments`

### POST `/orders/:id/payments/confirm`

### GET `/orders/:id/reports/:reportId/download`

## Promotions

### POST `/promotions/validate`

Body: `code`, `productId`, optional `orderAmount`. Returns discount quote.

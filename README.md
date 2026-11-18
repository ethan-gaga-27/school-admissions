# The Suite School Rwanda — admissions portal

A responsive HTML, CSS and JavaScript prototype based on the school admissions presentation. It includes a parent application form, an application-status page, and a school-office review dashboard.

## Run locally

Open `index.html` in a modern browser. There is no build step or package installation.

## Prototype behavior

- Parents can enter learner and guardian details, select a class, choose a report card and registration letter, and add an optional Urubuto Pay payment reference.
- The school office can review, accept or decline applications and update the displayed school name, welcome text and registration fee.
- Application records, school settings and decision statuses are stored in the browser's `localStorage` on that device.

## Important limitations

This is a local demonstration, not a production school system. Application details are not sent to a school or shared across devices. The browser records selected document filenames only; it does not upload or retain the document contents. Urubuto Pay is shown as a payment method, but no payment is processed or verified. The office view has no authentication or access control. Do not enter real student information or use this prototype to collect applications or fees.

A production launch needs a secure backend and database, authenticated parent and staff accounts, private document storage, server-side validation, access controls, privacy and retention policies, and a verified payment-provider integration. Publishing as an Android app would require a separate Android wrapper/build and Google Play Console submission.

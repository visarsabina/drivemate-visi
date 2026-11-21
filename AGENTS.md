# Architecture
- Store gallery posts per tenant and gate management with database-validated admin membership; public gallery reads are limited to active schools.
- Store gallery image paths in a dedicated private bucket with tenant-prefixed write policies; issue short-lived links for active-school posts rather than persisting URLs.
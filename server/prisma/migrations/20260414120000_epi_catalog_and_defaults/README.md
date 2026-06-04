This migration introduces a canonical EPI equipment catalog and category defaults, and migrates existing EPI issuance/request rows from free-text `itemType` to stable `itemCode`.

Notes:
- Legacy codes (`helmet`, `vest`, `gloves`, `shoes`, `shirt`) remain in the catalog but are marked `active=false`.
- Existing issuance/request rows are mapped to the closest new codes where possible.


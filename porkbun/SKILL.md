---
name: porkbun
description: "Porkbun DNS management via API. Create, edit, delete, list DNS records. Use for domain setup, Railway/Vercel/Coolify custom domains, CNAME/TXT/A record management."
---

# Porkbun DNS Management

## Credentials

Stored in `pass`:
```
api/porbkun/apikey       — API key
api/porbkun/secretapikey — Secret API key
```

Generate keys at: https://porkbun.com/account/api
Then enable API access per domain in Domain Management → Details → API Access.

## Auth Helper

Every Porkbun API call is `POST` with JSON body containing both keys:

```bash
PB_API=$(pass show api/porbkun/apikey)
PB_SECRET=$(pass show api/porbkun/secretapikey)

pb() {
  curl -s -X POST "https://api.porkbun.com/api/json/v3/$1" \
    -H "Content-Type: application/json" \
    -d "$(echo "$2" | jq --arg ak "$PB_API" --arg sk "$PB_SECRET" '. + {apikey: $ak, secretapikey: $sk}')"
}
```

## Ping (Test Auth)

```bash
pb "ping" '{}' | jq .
# → {"status":"SUCCESS","yourIp":"..."}
```

## List Records

```bash
pb "dns/retrieve/DOMAIN" '{}' | jq '.records[] | {id, name, type, content, ttl}'
```

Example:
```bash
pb "dns/retrieve/esen.works" '{}'
```

## Create Record

```bash
pb "dns/create/DOMAIN" '{"name":"SUBDOMAIN","type":"TYPE","content":"VALUE","ttl":"600"}'
```

Types: `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `ALIAS`, `SRV`, `TLSA`, `CAA`, `HTTPS`, `SVCB`, `SSHFP`

### CNAME
```bash
pb "dns/create/esen.works" '{"name":"transport","type":"CNAME","content":"djdd1474.up.railway.app"}'
```

### TXT (Railway verification)
```bash
pb "dns/create/esen.works" '{"name":"_railway-verify.transport","type":"TXT","content":"railway-verify=abc123..."}'
```

### A record (root domain)
```bash
pb "dns/create/esen.works" '{"name":"","type":"A","content":"1.2.3.4"}'
```

### Wildcard
```bash
pb "dns/create/esen.works" '{"name":"*","type":"A","content":"1.2.3.4"}'
```

## Edit Record

### By ID
```bash
pb "dns/edit/DOMAIN/RECORD_ID" '{"name":"www","type":"A","content":"1.1.1.2"}'
```

### By name + type (edit all matching)
```bash
pb "dns/editByNameType/DOMAIN/TYPE/SUBDOMAIN" '{"content":"NEW_VALUE"}'
```

Example — update CNAME:
```bash
pb "dns/editByNameType/esen.works/CNAME/transport" '{"content":"new-target.up.railway.app"}'
```

## Delete Record

### By ID
```bash
pb "dns/delete/DOMAIN/RECORD_ID" '{}'
```

### By name + type
```bash
pb "dns/deleteByNameType/DOMAIN/TYPE/SUBDOMAIN" '{}'
```

## Common Recipes

### Railway custom domain (CNAME + TXT)
```bash
DOMAIN="esen.works"
SUB="myapp"
CNAME_TARGET="xxxx.up.railway.app"
TXT_VALUE="railway-verify=abcdef..."

pb "dns/create/$DOMAIN" "{\"name\":\"$SUB\",\"type\":\"CNAME\",\"content\":\"$CNAME_TARGET\"}"
pb "dns/create/$DOMAIN" "{\"name\":\"_railway-verify.$SUB\",\"type\":\"TXT\",\"content\":\"$TXT_VALUE\"}"
```

### Vercel custom domain
```bash
pb "dns/create/example.com" '{"name":"","type":"A","content":"76.76.21.21"}'
pb "dns/create/example.com" '{"name":"www","type":"CNAME","content":"cname.vercel-dns.com"}'
```

### Coolify custom domain
```bash
pb "dns/create/example.com" '{"name":"app","type":"A","content":"SERVER_IP"}'
```

### List domains in account
```bash
pb "domain/listAll" '{}' | jq '.domains[] | {domain, status, expireDate}'
```

## Gotchas

- **All requests are POST** — even reads. GET returns errors.
- **`name` field is subdomain only** — don't include the domain. `"name":"www"` not `"name":"www.example.com"`.
- **Root records**: use `"name":""` (empty string).
- **Min TTL is 600** (10 minutes). Default is 600.
- **API access must be enabled per domain** — go to Domain Management → domain → Details → toggle API Access.
- **Rate limits**: undocumented but reasonable. Don't hammer.
- **Wildcard**: use `"name":"*"` — creates `*.domain.com`.

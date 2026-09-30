# Bakes Keycloak's own "optimized build" step (Quarkus augmentation) into
# the image at build time, rather than paying that cost on every container
# boot. On Render's free tier (0.1 CPU) that step alone took ~170s — long
# enough that Render's port-scan gave up and killed the container before
# Keycloak ever finished starting. `start --optimized` skips it entirely.
FROM quay.io/keycloak/keycloak:26.0 AS builder
RUN /opt/keycloak/bin/kc.sh build --db=postgres

FROM quay.io/keycloak/keycloak:26.0
COPY --from=builder /opt/keycloak/ /opt/keycloak/
# Same realm export used for local dev (docker-compose) — no secrets, no
# users, see kyma-realm.json's own header. The Google IdP client secret
# still gets entered by hand in the Admin Console per environment.
COPY kyma-realm.json /opt/keycloak/data/import/kyma-realm.json


# Render's free tier caps the container at 512MB. Left to its own container-
# aware defaults, the JVM sized its heap up to ~490MB at idle — a hair under
# the OOM line before any real traffic. Capping it explicitly leaves real
# headroom (verified locally: ~400MB/512MB idle instead of ~490MB/512MB).
ENV JAVA_OPTS_APPEND="-Xms64m -Xmx200m"

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized", "--hostname-strict=false", "--http-enabled=true", "--proxy-headers=xforwarded", "--cache=local", "--import-realm"]

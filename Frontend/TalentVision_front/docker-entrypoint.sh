#!/bin/sh
# Script pour configurer dynamiquement le resolver DNS Kubernetes
# Ce script sera exécuté par le docker-entrypoint.sh de base avant le démarrage de nginx

echo "99-configure-dns.sh: Starting DNS configuration..."

# Lire l'adresse IP du DNS depuis /etc/resolv.conf
DNS_IP=$(grep nameserver /etc/resolv.conf | awk '{print $2}' | head -n1)

# Si aucun DNS n'est trouvé, utiliser une valeur par défaut
if [ -z "$DNS_IP" ]; then
    DNS_IP="10.96.0.10"
    echo "99-configure-dns.sh: No DNS found in /etc/resolv.conf, using default: $DNS_IP"
else
    echo "99-configure-dns.sh: Found DNS in /etc/resolv.conf: $DNS_IP"
fi

# Remplacer le resolver dans la config nginx
sed -i "s/resolver .*;/resolver $DNS_IP valid=10s ipv6=off;/" /etc/nginx/conf.d/default.conf

# Tester si le backend service est résolvable
echo "99-configure-dns.sh: Testing backend service resolution..."
nslookup talentvision-backend-svc || echo "99-configure-dns.sh: Warning - backend service not immediately resolvable, but resolver will handle it at runtime"

echo "99-configure-dns.sh: Configured nginx resolver to use DNS: $DNS_IP"


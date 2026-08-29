FROM redis:7-alpine

RUN apk add --no-cache bash coreutils

WORKDIR /simulator

# Copy simulator code
COPY simulate.sh /simulator/simulate.sh
RUN chmod +x /simulator/simulate.sh

CMD ["tail", "-f", "/dev/null"]

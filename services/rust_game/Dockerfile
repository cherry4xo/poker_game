FROM rust:1.65.0 as build
ENV PKG_CONFIG_ALLOW_CROSS=1

WORKDIR /usr/src/rust_game
COPY . .

RUN cargo install --path .

FROM gcr.io/distroless/cc-debial10

COPY --from=build /usr/local/cargo/bin/rust_game /usr/local/bin/rust_game

CMD ["rust_game"]
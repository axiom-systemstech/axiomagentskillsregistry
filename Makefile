.PHONY: build run test clean

build:
	cargo build --release --manifest-path engine/Cargo.toml

run:
	cargo run --manifest-path engine/Cargo.toml

test:
	cargo test --manifest-path engine/Cargo.toml

clean:
	cargo clean --manifest-path engine/Cargo.toml
	rm -rf web/wasm/
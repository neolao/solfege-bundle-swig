test:
	 @NODE_ENV=test ./node_modules/.bin/mocha \
		--harmony \
		--recursive \
		--reporter spec \
		--bail

bench:
	@$(MAKE) -C benchmarks

.PHONY: test bench

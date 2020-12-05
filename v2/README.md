# v2

A ban scraper written in pure JavaScript that is meant to be hosted as a cloud function.

# Usage

- Create a cloud function with whatever provider you want
- Ensure you're able to read/write to a central place to update / read the latest ban

# Warning

- For webhook support, you currently need to add that in yourself.
- Modifying the `STARTING_BAN` is also needed for this to work.

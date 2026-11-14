/**
 * Runs the test suite in a timezone with DST so date logic is exercised across
 * spring-forward / fall-back. Must be set here (before workers spawn): Node on Windows
 * ignores later runtime changes to process.env.TZ once Date has been used.
 * Override with e.g. `TZ=Asia/Seoul npm test`.
 */
module.exports = async () => {
  process.env.TZ = process.env.TZ || 'America/New_York';
};

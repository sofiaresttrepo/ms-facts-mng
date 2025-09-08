"use strict";

const { EMPTY } = require("rxjs");
const FeedParser = require("./FeedParser");

module.exports = {
  /**
   * start workflow
   * @returns {Observable}
   */
  start$: EMPTY,
  /**
   * start for syncing workflow
   * @returns {Observable}
   */
  startForSyncing$: EMPTY,
  /**
   * start for getting ready workflow
   * @returns {Observable}
   */
  startForGettingReady$: EMPTY,
  /**
   * Stop workflow
   * @returns {Observable}
   */
  stop$: EMPTY,
  /**
   * @returns {FeedParser}
   */
  FeedParser,
};
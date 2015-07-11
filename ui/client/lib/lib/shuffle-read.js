
shuffleBytesRead = function(shuffleReadMetrics) {
  if (!shuffleReadMetrics) return 0;
  if ('metrics' in shuffleReadMetrics) shuffleReadMetrics = shuffleReadMetrics['metrics'];
  if ('ShuffleReadMetrics' in shuffleReadMetrics) shuffleReadMetrics = shuffleReadMetrics['ShuffleReadMetrics'];
  return shuffleReadMetrics && (shuffleReadMetrics.LocalBytesRead + shuffleReadMetrics.RemoteBytesRead) || 0;
};
Template.registerHelper("shuffleBytesRead", shuffleBytesRead);

shuffleBytesReadStr = function(shuffleReadMetrics) {
  return formatBytes(shuffleBytesRead(shuffleReadMetrics));
};
Template.registerHelper("shuffleBytesReadStr", shuffleBytesReadStr);

const trace = {
  emit(type, payload) {
    if (typeof window.__trace !== 'undefined') {
      window.__trace.push({ type, ...payload });
    }
  }
};

<template>
  <div class="empty">
    <div class="empty__icon">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
        <path d="M28 50s14-11 14-22a14 14 0 0 0-28 0c0 11 14 22 14 22z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="28" cy="26" r="5" stroke="currentColor" stroke-width="2"/>
        <circle cx="28" cy="26" r="2" fill="currentColor" opacity="0.5"/>
      </svg>
    </div>
    <h3 class="empty__title">아직 제안된 장소가 없어요</h3>
    <p class="empty__sub">첫 번째로 제안해보세요!</p>
  </div>
</template>

<style scoped>
.empty {
  background: #FAFAFB;
  border-radius: 14px;
  padding: 48px 28px;
  text-align: center;
  margin-bottom: 14px;
  color: var(--color-primary);
}
.empty__icon {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}
.empty__title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}
.empty__sub {
  margin: 0;
  font-size: 13.5px;
  color: var(--color-text-secondary);
  line-height: 1.55;
}
</style>

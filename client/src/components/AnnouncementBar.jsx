export function AnnouncementBar({ config }) {
  const { mainText, subText } = config.announcement || {};
  if (!mainText && !subText) return null;
  return (
    <div className="announcement" role="region" aria-label="Store announcement">
      <div className="announcement__inner page-width">
        <span className="announcement__gradient">{mainText}</span>
        {subText ? <span className="announcement__sub">{subText}</span> : null}
      </div>
    </div>
  );
}

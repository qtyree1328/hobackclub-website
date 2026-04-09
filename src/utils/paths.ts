const ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z\d+\-.]*:)?\/\//i;

export function withBase(path: string): string {
  if (
    !path ||
    ABSOLUTE_URL_REGEX.test(path) ||
    path.startsWith('#') ||
    path.startsWith('mailto:') ||
    path.startsWith('tel:')
  ) {
    return path;
  }

  const base = import.meta.env.BASE_URL === '/'
    ? ''
    : import.meta.env.BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${base}${normalizedPath}`;
}

export function normalizePathname(pathname: string): string {
  const base = import.meta.env.BASE_URL === '/'
    ? ''
    : import.meta.env.BASE_URL.replace(/\/$/, '');

  let normalizedPath = pathname || '/';

  if (base && normalizedPath.startsWith(base)) {
    normalizedPath = normalizedPath.slice(base.length) || '/';
  }

  normalizedPath = normalizedPath.replace(/\/index\.html$/, '/');

  if (normalizedPath.length > 1) {
    normalizedPath = normalizedPath.replace(/\/$/, '');
  }

  return normalizedPath || '/';
}

export function isActivePath(currentPath: string, targetPath: string): boolean {
  return normalizePathname(currentPath) === normalizePathname(targetPath);
}

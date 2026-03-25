/**
 * 모듈 레벨 유저 세션 — circular dependency 없이
 * appStore 같은 비-React 코드에서 현재 유저 정보를 읽기 위해 사용
 */

export interface SessionUser {
  name: string;
  email: string;
}

let _user: SessionUser | null = null;

export function setSessionUser(u: SessionUser | null): void {
  _user = u;
}

export function getSessionUser(): SessionUser | null {
  return _user;
}

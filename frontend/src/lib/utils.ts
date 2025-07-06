import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function showAlert(message: string) {
  try {
    window.Telegram.WebApp.showAlert(message);
  } catch (error) {
    alert(message);
  }
};

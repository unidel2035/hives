#!/usr/bin/env python3
"""
Быстрый анализ PAC файла
Показывает основную информацию без глубокой декомпиляции
"""

import re
import json
import sys


def quick_analyze(pac_file):
    """Быстрый анализ PAC файла"""
    try:
        with open(pac_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print(f"📄 Анализ PAC файла: {pac_file}")
        print("=" * 50)
        
        # Размер файла
        size = len(content)
        print(f"📊 Размер файла: {size:,} символов")
        
        # Поиск основных секций
        sections = {
            'domains': 'var domains = {',
            'ip_list': 'var d_ipaddr = "',
            'special': 'var special = [',
            'domains_lzp': 'var domains_lzp = "',
            'mask_lzp': 'var mask_lzp = "'
        }
        
        print("\n🔍 Найденные секции:")
        for name, pattern in sections.items():
            if pattern in content:
                print(f"  ✅ {name}")
            else:
                print(f"  ❌ {name}")
        
        # Подсчет строк
        lines = content.count('\n')
        print(f"\n📝 Количество строк: {lines:,}")
        
        # Поиск функций
        functions = re.findall(r'function\s+(\w+)', content)
        if functions:
            print(f"\n⚙️  Найденные функции: {', '.join(set(functions))}")
        
        # Поиск прокси серверов
        proxy_servers = re.findall(r'([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}:\d+)', content)
        if proxy_servers:
            unique_servers = list(set(proxy_servers))
            print(f"\n🌐 Прокси серверы: {len(unique_servers)}")
            for server in unique_servers[:5]:  # Показываем первые 5
                print(f"  • {server}")
            if len(unique_servers) > 5:
                print(f"  ... и ещё {len(unique_servers) - 5}")
        
        # Основные зоны доменов
        zones = re.findall(r'"([a-z]{2,4})":{', content)
        if zones:
            unique_zones = list(set(zones))
            print(f"\n🏢 Доменные зоны: {len(unique_zones)}")
            print(f"  Примеры: {', '.join(unique_zones[:10])}")
        
        # Специальные IP диапазоны
        ip_ranges = re.findall(r'\d+\.\d+\.\d+\.\d+', content)
        if ip_ranges:
            unique_ips = list(set(ip_ranges))
            print(f"\n🌐 IP адреса: {len(unique_ips)} уникальных")
        
        print("\n" + "=" * 50)
        print("✅ Быстрый анализ завершен")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка анализа: {e}")
        return False


def main():
    if len(sys.argv) < 2:
        print("Использование: python quick_pac_analysis.py <pac_file>")
        print("Пример: python quick_pac_analysis.py pac.pac")
        sys.exit(1)
    
    pac_file = sys.argv[1]
    quick_analyze(pac_file)


if __name__ == "__main__":
    main()

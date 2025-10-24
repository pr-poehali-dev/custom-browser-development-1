import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HistoryItem {
  id: string;
  url: string;
  title: string;
  timestamp: number;
}

interface Tab {
  id: string;
  url: string;
  title: string;
  isActive: boolean;
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', url: '', title: 'Новая вкладка', isActive: true }
  ]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcExpression, setCalcExpression] = useState('');
  const [showCookieWarning, setShowCookieWarning] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem('browser-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    if (currentUrl) {
      const timer = setTimeout(() => {
        setShowCookieWarning(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentUrl]);

  const saveToHistory = (url: string, title: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      url,
      title,
      timestamp: Date.now()
    };
    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('browser-history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('browser-history');
    toast.success('История очищена');
    setIsSidebarOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    let url = searchQuery;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        url = 'https://' + url;
      } else {
        url = 'https://yandex.ru/search/?text=' + encodeURIComponent(url);
      }
    }

    setCurrentUrl(url);
    saveToHistory(url, searchQuery);
    
    const activeTabIndex = tabs.findIndex(t => t.isActive);
    const updatedTabs = [...tabs];
    updatedTabs[activeTabIndex] = {
      ...updatedTabs[activeTabIndex],
      url,
      title: searchQuery
    };
    setTabs(updatedTabs);
    
    toast.success('Сайт загружен');
  };

  const addNewTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      url: '',
      title: 'Новая вкладка',
      isActive: true
    };
    setTabs(tabs.map(t => ({ ...t, isActive: false })).concat(newTab));
    setCurrentUrl('');
    setSearchQuery('');
    setShowCookieWarning(false);
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) return;
    const tabIndex = tabs.findIndex(t => t.id === id);
    const newTabs = tabs.filter(t => t.id !== id);
    
    if (tabs[tabIndex].isActive && newTabs.length > 0) {
      newTabs[Math.min(tabIndex, newTabs.length - 1)].isActive = true;
      const activeTab = newTabs.find(t => t.isActive);
      setCurrentUrl(activeTab?.url || '');
      setSearchQuery(activeTab?.title || '');
    }
    
    setTabs(newTabs);
    setShowCookieWarning(false);
  };

  const switchTab = (id: string) => {
    const updatedTabs = tabs.map(t => ({
      ...t,
      isActive: t.id === id
    }));
    setTabs(updatedTabs);
    const activeTab = updatedTabs.find(t => t.id === id);
    setCurrentUrl(activeTab?.url || '');
    setSearchQuery(activeTab?.title || '');
    setShowCookieWarning(!!activeTab?.url);
  };

  const openFromHistory = (item: HistoryItem) => {
    setSearchQuery(item.title);
    setCurrentUrl(item.url);
    
    const activeTabIndex = tabs.findIndex(t => t.isActive);
    const updatedTabs = [...tabs];
    updatedTabs[activeTabIndex] = {
      ...updatedTabs[activeTabIndex],
      url: item.url,
      title: item.title
    };
    setTabs(updatedTabs);
    setIsSidebarOpen(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} дн назад`;
    return date.toLocaleDateString('ru-RU');
  };

  const handleCalcButton = (value: string) => {
    if (value === 'C') {
      setCalcDisplay('0');
      setCalcExpression('');
    } else if (value === '=') {
      try {
        const result = eval(calcExpression || calcDisplay);
        setCalcDisplay(result.toString());
        setCalcExpression('');
      } catch {
        setCalcDisplay('Ошибка');
        setCalcExpression('');
      }
    } else if (['+', '-', '*', '/'].includes(value)) {
      setCalcExpression(calcDisplay + value);
      setCalcDisplay('0');
    } else {
      if (calcDisplay === '0') {
        setCalcDisplay(value);
      } else {
        setCalcDisplay(calcDisplay + value);
      }
    }
  };

  const scanWebsite = () => {
    setIsScanning(true);
    toast.info('Сканирование сайта...');
    
    setTimeout(() => {
      setIsScanning(false);
      const hasVirus = Math.random() > 0.7;
      
      if (hasVirus) {
        toast.error('⚠️ Обнаружены потенциальные угрозы!', {
          description: 'Рекомендуем покинуть этот сайт',
          action: {
            label: 'Выйти',
            onClick: () => {
              setCurrentUrl('');
              setSearchQuery('');
              const activeTabIndex = tabs.findIndex(t => t.isActive);
              const updatedTabs = [...tabs];
              updatedTabs[activeTabIndex] = {
                ...updatedTabs[activeTabIndex],
                url: '',
                title: 'Новая вкладка'
              };
              setTabs(updatedTabs);
            }
          }
        });
      } else {
        toast.success('✓ Сайт безопасен');
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-browser flex flex-col">
      <div className="flex-1 flex flex-col">
        <div className="bg-white/95 backdrop-blur-sm shadow-lg">
          <div className="px-4 py-3 flex items-center gap-3">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hover:bg-primary/10 transition-colors"
                >
                  <Icon name="Menu" size={24} className="text-primary" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="h-full flex flex-col">
                  <div className="p-6 bg-gradient-browser">
                    <h2 className="text-xl font-bold text-white">История</h2>
                  </div>
                  
                  <ScrollArea className="flex-1 px-4 py-4">
                    {history.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Icon name="History" size={48} className="mx-auto mb-4 opacity-40" />
                        <p>История пуста</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {history.map((item) => (
                          <Card
                            key={item.id}
                            className="p-4 cursor-pointer hover:bg-accent transition-colors group"
                            onClick={() => openFromHistory(item)}
                          >
                            <div className="flex items-start gap-3">
                              <Icon name="Globe" size={20} className="text-primary mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                  {item.title}
                                </h3>
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                  {item.url}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDate(item.timestamp)}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <div className="p-4 border-t">
                    <Button 
                      onClick={clearHistory}
                      variant="destructive"
                      className="w-full rounded-full"
                      disabled={history.length === 0}
                    >
                      <Icon name="Trash2" size={18} className="mr-2" />
                      Очистить историю
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Icon 
                  name="Search" 
                  size={20} 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="text"
                  placeholder="Поиск или введите адрес"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 h-12 rounded-full border-2 border-primary/20 focus:border-primary transition-colors text-base"
                />
              </div>
            </form>

            {currentUrl && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/10 transition-colors"
                  >
                    <Icon name="MoreVertical" size={20} className="text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setIsCalculatorOpen(true)}>
                    <Icon name="Calculator" size={16} className="mr-2" />
                    Калькулятор
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={scanWebsite} disabled={isScanning}>
                    <Icon name="Shield" size={16} className="mr-2" />
                    {isScanning ? 'Сканирование...' : 'Анализ на вирусы'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              onClick={addNewTab}
              size="icon"
              className="rounded-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity shadow-lg"
            >
              <Icon name="Plus" size={20} />
            </Button>
          </div>

          <ScrollArea className="border-t">
            <div className="flex gap-1 px-2 py-2 min-w-max">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all ${
                    tab.isActive
                      ? 'bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Icon 
                    name={tab.url ? 'Globe' : 'Plus'} 
                    size={16} 
                    className={tab.isActive ? 'text-primary' : 'text-muted-foreground'}
                  />
                  <span className={`text-sm max-w-[120px] truncate ${
                    tab.isActive ? 'font-medium text-primary' : 'text-muted-foreground'
                  }`}>
                    {tab.title}
                  </span>
                  {tabs.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                      className="hover:bg-destructive/10 rounded-full p-1 transition-colors"
                    >
                      <Icon name="X" size={14} className="text-muted-foreground hover:text-destructive" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 relative">
          {showCookieWarning && currentUrl && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-fade-in">
              <Alert className="bg-white/95 backdrop-blur shadow-xl border-2 border-primary/20">
                <Icon name="Cookie" size={20} className="text-primary" />
                <AlertDescription className="ml-6">
                  <p className="font-medium mb-1">Этот сайт использует файлы cookie</p>
                  <p className="text-xs text-muted-foreground">Продолжая просмотр, вы соглашаетесь с их использованием</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCookieWarning(false)}
                    className="mt-2 rounded-full"
                  >
                    Понятно
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {currentUrl ? (
            <div className="absolute inset-0 bg-white m-4 md:m-8 rounded-3xl shadow-2xl overflow-hidden">
              <iframe
                src={currentUrl}
                className="w-full h-full"
                title="Browser content"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full px-4">
              <div className="text-center max-w-2xl animate-fade-in">
                <div className="mb-8">
                  <Icon name="Compass" size={80} className="mx-auto text-white/90 mb-6" />
                  <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                    HimoBrowser@admin.com
                  </h1>
                  <p className="text-lg md:text-xl text-white/80">
                    Введите адрес сайта или поисковый запрос выше
                  </p>
                </div>

                <Card className="p-8 bg-white/95 backdrop-blur hover:shadow-xl transition-shadow max-w-md mx-auto">
                  <Icon name="Calculator" size={48} className="mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold text-xl mb-2">Калькулятор</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Быстрые вычисления прямо в браузере
                  </p>
                  <Button
                    onClick={() => setIsCalculatorOpen(true)}
                    className="w-full rounded-full bg-gradient-to-r from-primary to-secondary"
                  >
                    Открыть калькулятор
                  </Button>
                  <div className="mt-6 pt-4 border-t">
                    <a
                      href="https://t.me/HimoBrowses"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-sm text-primary hover:text-secondary transition-colors"
                    >
                      <Icon name="Radio" size={16} />
                      Новости браузера
                    </a>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Калькулятор</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-2xl">
              <div className="text-right text-3xl font-bold text-primary min-h-[50px] flex items-center justify-end">
                {calcDisplay}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['7', '8', '9', '/'].map(btn => (
                <Button
                  key={btn}
                  onClick={() => handleCalcButton(btn)}
                  variant="outline"
                  className="h-14 text-lg rounded-xl hover:bg-primary/10"
                >
                  {btn}
                </Button>
              ))}
              {['4', '5', '6', '*'].map(btn => (
                <Button
                  key={btn}
                  onClick={() => handleCalcButton(btn)}
                  variant="outline"
                  className="h-14 text-lg rounded-xl hover:bg-primary/10"
                >
                  {btn}
                </Button>
              ))}
              {['1', '2', '3', '-'].map(btn => (
                <Button
                  key={btn}
                  onClick={() => handleCalcButton(btn)}
                  variant="outline"
                  className="h-14 text-lg rounded-xl hover:bg-primary/10"
                >
                  {btn}
                </Button>
              ))}
              {['C', '0', '=', '+'].map(btn => (
                <Button
                  key={btn}
                  onClick={() => handleCalcButton(btn)}
                  variant={btn === '=' ? 'default' : 'outline'}
                  className={`h-14 text-lg rounded-xl ${
                    btn === '=' 
                      ? 'bg-gradient-to-r from-primary to-secondary text-white' 
                      : 'hover:bg-primary/10'
                  }`}
                >
                  {btn}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface Withdrawal {
  id: number;
  userName: string;
  userEmail: string;
  amount: number;
  phoneNumber: string;
  bankName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [currentSection, setCurrentSection] = useState('home');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  const handleRegister = () => {
    if (username && email && password) {
      setIsAuthenticated(true);
      toast({
        title: "Регистрация успешна!",
        description: "Добро пожаловать в платформу заработка",
      });
      setCurrentSection('dashboard');
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !phoneNumber || !selectedBank) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля для вывода",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/93e6ec4d-e680-4c35-9bd9-9ffdb0c3c1b6', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: username,
          userEmail: email,
          amount: withdrawAmount,
          phoneNumber: phoneNumber,
          bankName: getBankName(selectedBank),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "✅ Заявка принята",
          description: `Вывод ${withdrawAmount}₽ через СБП на номер ${phoneNumber} обрабатывается`,
        });

        setTimeout(() => {
          toast({
            title: "🔄 Заявка в обработке",
            description: `Администратор получил вашу заявку`,
          });
        }, 3000);

        setWithdrawAmount('');
        setPhoneNumber('');
        setSelectedBank('');
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось создать заявку. Попробуйте позже",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Проблема с подключением. Попробуйте позже",
        variant: "destructive",
      });
    }
  };

  const getBankName = (bankCode: string) => {
    const banks: Record<string, string> = {
      sber: 'Сбербанк',
      tinkoff: 'Тинькофф',
      alpha: 'Альфа-Банк',
      vtb: 'ВТБ',
      raiff: 'Райффайзен',
    };
    return banks[bankCode] || bankCode;
  };

  const fetchWithdrawals = async () => {
    if (!isAdmin || !adminKey) return;

    try {
      const url = statusFilter === 'all' 
        ? 'https://functions.poehali.dev/6bc27e0f-ee67-4836-a793-216834c60469'
        : `https://functions.poehali.dev/6bc27e0f-ee67-4836-a793-216834c60469?status=${statusFilter}`;
      
      const response = await fetch(url, {
        headers: {
          'X-Admin-Key': adminKey,
        },
      });

      const data = await response.json();
      if (data.success) {
        setWithdrawals(data.withdrawals);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    }
  };

  const handleAdminLogin = () => {
    if (adminKey === 'admin123') {
      setIsAdmin(true);
      setCurrentSection('admin');
      toast({
        title: "Вход выполнен",
        description: "Добро пожаловать в админ-панель",
      });
    } else {
      toast({
        title: "Ошибка",
        description: "Неверный ключ администратора",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const response = await fetch('https://functions.poehali.dev/9cd8b1b8-b6c0-4f80-8b67-01b8d8ead733', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminKey,
        },
        body: JSON.stringify({ id, status }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Статус обновлён",
          description: `Заявка #${id} ${status === 'approved' ? 'одобрена' : 'отклонена'}`,
        });
        fetchWithdrawals();
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isAdmin && currentSection === 'admin') {
      fetchWithdrawals();
    }
  }, [isAdmin, currentSection, statusFilter]);

  const NavButton = ({ section, icon, label }: { section: string; icon: string; label: string }) => (
    <Button
      variant={currentSection === section ? 'default' : 'ghost'}
      onClick={() => setCurrentSection(section)}
      className="w-full justify-start gap-2"
    >
      <Icon name={icon} size={20} />
      {label}
    </Button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary via-secondary to-accent rounded-xl flex items-center justify-center">
              <Icon name="Wallet" className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              MoneyPlatform
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <>
                <div className="px-4 py-2 bg-primary/10 rounded-lg">
                  <span className="text-sm font-semibold text-primary">Баланс: 5,240₽</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsAuthenticated(false)}>
                  Выход
                </Button>
              </>
            )}
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setCurrentSection('admin')}>
                <Icon name="Shield" size={16} className="mr-1" />
                Админ
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-4 space-y-2">
                <NavButton section="home" icon="Home" label="Главная" />
                {!isAuthenticated && (
                  <NavButton section="register" icon="UserPlus" label="Регистрация" />
                )}
                {isAuthenticated && (
                  <>
                    <NavButton section="dashboard" icon="LayoutDashboard" label="Личный кабинет" />
                    <NavButton section="cards" icon="CreditCard" label="Оформление карт" />
                    <NavButton section="withdraw" icon="Banknote" label="Вывод средств" />
                  </>
                )}
                <NavButton section="faq" icon="HelpCircle" label="Вопросы и ответы" />
                <NavButton section="contacts" icon="Mail" label="Контакты" />
                {!isAdmin && (
                  <div className="pt-4 border-t">
                    <NavButton section="admin-login" icon="Shield" label="Админ-вход" />
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>

          <main className="lg:col-span-3">
            {currentSection === 'home' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <Card className="border-0 shadow-xl bg-gradient-to-br from-primary via-secondary to-accent text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <CardHeader className="relative z-10">
                    <CardTitle className="text-4xl font-bold mb-2">Зарабатывайте онлайн</CardTitle>
                    <CardDescription className="text-white/90 text-lg">
                      Современная платформа для заработка с моментальным выводом средств
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={() => setCurrentSection('register')}
                      className="bg-white text-primary hover:bg-white/90"
                    >
                      Начать зарабатывать <Icon name="ArrowRight" size={20} className="ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { icon: 'Zap', title: 'Быстрый старт', desc: 'Регистрация за 2 минуты' },
                    { icon: 'Shield', title: 'Безопасность', desc: 'Защита данных 24/7' },
                    { icon: 'TrendingUp', title: 'Рост дохода', desc: 'До 50,000₽ в месяц' },
                  ].map((feature, idx) => (
                    <Card key={idx} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <CardHeader>
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-3">
                          <Icon name={feature.icon} className="text-white" size={24} />
                        </div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                        <CardDescription>{feature.desc}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {currentSection === 'register' && !isAuthenticated && (
              <Card className="animate-in fade-in duration-500">
                <CardHeader>
                  <CardTitle className="text-3xl">Регистрация</CardTitle>
                  <CardDescription>Создайте аккаунт для доступа ко всем функциям</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Имя пользователя</label>
                    <Input
                      placeholder="Введите имя"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      placeholder="example@mail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Пароль</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleRegister} className="w-full" size="lg">
                    Зарегистрироваться
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentSection === 'dashboard' && isAuthenticated && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-3xl">Личный кабинет</CardTitle>
                    <CardDescription>Управляйте своими финансами</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon name="Wallet" className="text-primary" size={28} />
                          <span className="text-sm text-muted-foreground">Общий баланс</span>
                        </div>
                        <p className="text-4xl font-bold text-primary">5,240₽</p>
                      </div>
                      <div className="p-6 bg-gradient-to-br from-accent/10 to-primary/10 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon name="TrendingUp" className="text-accent" size={28} />
                          <span className="text-sm text-muted-foreground">Заработано за месяц</span>
                        </div>
                        <p className="text-4xl font-bold text-accent">12,890₽</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Последние транзакции</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { type: 'Пополнение', amount: '+2,500₽', date: '28.10.2025' },
                        { type: 'Вывод', amount: '-1,000₽', date: '27.10.2025' },
                        { type: 'Пополнение', amount: '+3,740₽', date: '26.10.2025' },
                      ].map((transaction, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.amount.startsWith('+') ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              <Icon
                                name={transaction.amount.startsWith('+') ? 'ArrowDownLeft' : 'ArrowUpRight'}
                                className={transaction.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'}
                                size={20}
                              />
                            </div>
                            <div>
                              <p className="font-medium">{transaction.type}</p>
                              <p className="text-sm text-muted-foreground">{transaction.date}</p>
                            </div>
                          </div>
                          <span className={`font-bold ${
                            transaction.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentSection === 'cards' && isAuthenticated && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-3xl">Оформление карт</CardTitle>
                    <CardDescription>Выберите подходящую карту для получения дохода</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="debit" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="debit">Дебетовые карты</TabsTrigger>
                        <TabsTrigger value="virtual">Виртуальные карты</TabsTrigger>
                      </TabsList>
                      <TabsContent value="debit" className="space-y-4 mt-6">
                        {[
                          { name: 'Premium Card', cashback: '5%', limit: '1,000,000₽', color: 'from-purple-600 to-blue-600' },
                          { name: 'Standard Card', cashback: '3%', limit: '500,000₽', color: 'from-blue-600 to-cyan-600' },
                          { name: 'Basic Card', cashback: '1%', limit: '100,000₽', color: 'from-pink-600 to-purple-600' },
                        ].map((card, idx) => (
                          <Card key={idx} className="overflow-hidden hover:shadow-xl transition-all duration-300">
                            <div className={`h-32 bg-gradient-to-r ${card.color} p-6 text-white`}>
                              <p className="text-xl font-bold mb-2">{card.name}</p>
                              <p className="text-sm opacity-90">Кэшбэк {card.cashback}</p>
                            </div>
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Лимит</p>
                                  <p className="font-semibold">{card.limit}</p>
                                </div>
                                <Button>Оформить</Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </TabsContent>
                      <TabsContent value="virtual" className="space-y-4 mt-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Виртуальная карта для онлайн-платежей</CardTitle>
                            <CardDescription>Мгновенный выпуск без комиссии</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Button className="w-full">Создать виртуальную карту</Button>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentSection === 'withdraw' && isAuthenticated && (
              <Card className="animate-in fade-in duration-500">
                <CardHeader>
                  <CardTitle className="text-3xl flex items-center gap-2">
                    <Icon name="Banknote" size={32} />
                    Вывод через СБП
                  </CardTitle>
                  <CardDescription>Моментальный перевод на любой банк по номеру телефона</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Доступно для вывода</p>
                    <p className="text-3xl font-bold text-primary">5,240₽</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Сумма вывода</label>
                      <Input
                        type="number"
                        placeholder="Введите сумму"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Icon name="Smartphone" size={16} />
                        Номер телефона для СБП
                      </label>
                      <Input
                        placeholder="+7 (___) ___-__-__"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        maxLength={18}
                      />
                      <p className="text-xs text-muted-foreground">Введите номер в формате +7 (999) 123-45-67</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Icon name="Building2" size={16} />
                        Банк для СБП
                      </label>
                      <Select value={selectedBank} onValueChange={setSelectedBank}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите ваш банк" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sber">Сбербанк</SelectItem>
                          <SelectItem value="tinkoff">Тинькофф</SelectItem>
                          <SelectItem value="alpha">Альфа-Банк</SelectItem>
                          <SelectItem value="vtb">ВТБ</SelectItem>
                          <SelectItem value="raiff">Райффайзен</SelectItem>
                          <SelectItem value="psb">ПСБ</SelectItem>
                          <SelectItem value="gazprom">Газпромбанк</SelectItem>
                          <SelectItem value="open">Открытие</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                      <div className="flex gap-2">
                        <Icon name="Zap" className="text-blue-600 mt-0.5" size={20} />
                        <div>
                          <p className="text-sm font-bold text-blue-900">Вывод через СБП — мгновенно!</p>
                          <p className="text-xs text-blue-700 mt-1">Комиссия 0% • Перевод за 1-3 минуты • Доступно 24/7</p>
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleWithdraw} className="w-full" size="lg">
                      Вывести средства <Icon name="Send" size={18} className="ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentSection === 'faq' && (
              <Card className="animate-in fade-in duration-500">
                <CardHeader>
                  <CardTitle className="text-3xl">Вопросы и ответы</CardTitle>
                  <CardDescription>Ответы на часто задаваемые вопросы</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Как начать зарабатывать?</AccordionTrigger>
                      <AccordionContent>
                        Зарегистрируйтесь на платформе, пройдите верификацию и начните выполнять задания. Все заработанные средства доступны для вывода.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Сколько времени занимает вывод средств?</AccordionTrigger>
                      <AccordionContent>
                        Обычно вывод средств занимает от 1 до 24 часов. В большинстве случаев деньги поступают в течение нескольких часов.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Есть ли комиссия за вывод?</AccordionTrigger>
                      <AccordionContent>
                        Нет, платформа не взимает комиссию за вывод средств. Вы получаете всю сумму целиком.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                      <AccordionTrigger>Нужно ли оформлять карту?</AccordionTrigger>
                      <AccordionContent>
                        Оформление карты не обязательно. Вы можете выводить средства на любую банковскую карту. Наши карты предлагают дополнительные преимущества, такие как кэшбэк.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {currentSection === 'contacts' && (
              <Card className="animate-in fade-in duration-500">
                <CardHeader>
                  <CardTitle className="text-3xl">Контакты</CardTitle>
                  <CardDescription>Свяжитесь с нами удобным способом</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl">
                      <Icon name="Mail" className="text-primary mb-3" size={32} />
                      <p className="font-semibold mb-1">Email</p>
                      <p className="text-muted-foreground">support@moneyplatform.ru</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-secondary/10 to-accent/10 rounded-xl">
                      <Icon name="Phone" className="text-secondary mb-3" size={32} />
                      <p className="font-semibold mb-1">Телефон</p>
                      <p className="text-muted-foreground">8 (800) 555-35-35</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-accent/10 to-primary/10 rounded-xl">
                      <Icon name="MessageCircle" className="text-accent mb-3" size={32} />
                      <p className="font-semibold mb-1">Telegram</p>
                      <p className="text-muted-foreground">@moneyplatform_support</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl">
                      <Icon name="Clock" className="text-primary mb-3" size={32} />
                      <p className="font-semibold mb-1">Режим работы</p>
                      <p className="text-muted-foreground">Круглосуточно, 24/7</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isAuthenticated && (currentSection === 'dashboard' || currentSection === 'cards' || currentSection === 'withdraw') && (
              <Card className="animate-in fade-in duration-500 border-2 border-primary/20">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="Lock" className="text-primary" size={40} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Требуется регистрация</h3>
                  <p className="text-muted-foreground mb-6">
                    Зарегистрируйтесь, чтобы получить доступ к этому разделу
                  </p>
                  <Button onClick={() => setCurrentSection('register')} size="lg">
                    Зарегистрироваться
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentSection === 'admin-login' && !isAdmin && (
              <Card className="animate-in fade-in duration-500">
                <CardHeader>
                  <CardTitle className="text-3xl">Вход для администратора</CardTitle>
                  <CardDescription>Введите ключ доступа</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ключ администратора</label>
                    <Input
                      type="password"
                      placeholder="Введите ключ"
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAdminLogin} className="w-full" size="lg">
                    Войти
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentSection === 'admin' && isAdmin && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Icon name="Clock" className="text-blue-600" size={24} />
                        <Badge variant="secondary">{withdrawals.filter(w => w.status === 'pending').length}</Badge>
                      </div>
                      <p className="text-sm text-blue-700 mb-1">В ожидании</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0).toLocaleString()}₽
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Icon name="CheckCircle" className="text-green-600" size={24} />
                        <Badge variant="secondary">{withdrawals.filter(w => w.status === 'approved').length}</Badge>
                      </div>
                      <p className="text-sm text-green-700 mb-1">Одобрено</p>
                      <p className="text-2xl font-bold text-green-900">
                        {withdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + w.amount, 0).toLocaleString()}₽
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Icon name="XCircle" className="text-red-600" size={24} />
                        <Badge variant="secondary">{withdrawals.filter(w => w.status === 'rejected').length}</Badge>
                      </div>
                      <p className="text-sm text-red-700 mb-1">Отклонено</p>
                      <p className="text-2xl font-bold text-red-900">
                        {withdrawals.filter(w => w.status === 'rejected').reduce((sum, w) => sum + w.amount, 0).toLocaleString()}₽
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Icon name="Wallet" className="text-purple-600" size={24} />
                        <Badge variant="secondary">{withdrawals.length}</Badge>
                      </div>
                      <p className="text-sm text-purple-700 mb-1">Всего заявок</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {withdrawals.reduce((sum, w) => sum + w.amount, 0).toLocaleString()}₽
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-3xl flex items-center gap-2">
                      <Icon name="Shield" size={32} className="text-primary" />
                      Управление заявками
                    </CardTitle>
                    <CardDescription>Список всех заявок на вывод средств</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все заявки</SelectItem>
                          <SelectItem value="pending">В ожидании</SelectItem>
                          <SelectItem value="approved">Одобрено</SelectItem>
                          <SelectItem value="rejected">Отклонено</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={fetchWithdrawals} variant="outline">
                        <Icon name="RefreshCw" size={18} className="mr-2" />
                        Обновить
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {withdrawals.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Icon name="Inbox" size={48} className="mx-auto mb-3 opacity-50" />
                          <p>Заявок пока нет</p>
                        </div>
                      ) : (
                        withdrawals.map((withdrawal) => (
                          <Card key={withdrawal.id} className="border-2">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-lg">Заявка #{withdrawal.id}</span>
                                    <Badge 
                                      variant={
                                        withdrawal.status === 'approved' ? 'default' : 
                                        withdrawal.status === 'rejected' ? 'destructive' : 
                                        'secondary'
                                      }
                                    >
                                      {withdrawal.status === 'pending' && '⏳ В ожидании'}
                                      {withdrawal.status === 'approved' && '✅ Одобрено'}
                                      {withdrawal.status === 'rejected' && '❌ Отклонено'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(withdrawal.createdAt).toLocaleString('ru-RU')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-primary">{withdrawal.amount}₽</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-3 mb-4">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Пользователь</p>
                                    <p className="font-medium">{withdrawal.userName}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Email</p>
                                    <p className="font-medium">{withdrawal.userEmail}</p>
                                  </div>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Icon name="Smartphone" className="text-amber-700" size={20} />
                                    <p className="text-sm font-bold text-amber-900">Реквизиты СБП для перевода</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-xs text-amber-700 mb-1">Номер телефона</p>
                                      <p className="font-mono font-bold text-amber-900 text-xl">
                                        {withdrawal.phoneNumber}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-amber-700 mb-1">Банк получателя</p>
                                      <p className="font-bold text-amber-900 text-lg">{withdrawal.bankName}</p>
                                    </div>
                                  </div>
                                  <div className="mt-3 pt-3 border-t border-amber-300">
                                    <p className="text-xs text-amber-800">
                                      ⚡ Используйте СБП в вашем банковском приложении для перевода
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {withdrawal.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => handleUpdateStatus(withdrawal.id, 'approved')}
                                    className="flex-1"
                                    size="sm"
                                  >
                                    <Icon name="Check" size={16} className="mr-1" />
                                    Одобрить
                                  </Button>
                                  <Button 
                                    onClick={() => handleUpdateStatus(withdrawal.id, 'rejected')}
                                    variant="destructive"
                                    className="flex-1"
                                    size="sm"
                                  >
                                    <Icon name="X" size={16} className="mr-1" />
                                    Отклонить
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>

      <footer className="bg-white/80 backdrop-blur-md border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>© 2025 MoneyPlatform. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
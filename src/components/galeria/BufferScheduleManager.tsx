import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Loader2, Plus, Trash2, Save, Calendar, Clock, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Segunda' },
  { value: 'tuesday', label: 'Terça' },
  { value: 'wednesday', label: 'Quarta' },
  { value: 'thursday', label: 'Quinta' },
  { value: 'friday', label: 'Sexta' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

export default function BufferScheduleManager() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [manualBufferToken, setManualBufferToken] = useState('');
  const [savingManualBuffer, setSavingManualBuffer] = useState(false);
  const [manualBufferSuccess, setManualBufferSuccess] = useState<string | null>(null);

  const handleSaveManualBufferToken = async () => {
    if (!manualBufferToken) return;
    setSavingManualBuffer(true);
    setManualBufferSuccess(null);
    try {
      const response = await fetch("https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/auth/buffer/manual-token", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: manualBufferToken })
      });
      const data = await response.json();
      if (data.success) {
        setManualBufferSuccess('Token do Buffer atualizado com sucesso!');
        setManualBufferToken('');
        setError(null);
        fetchProfiles(); // reload profiles
      } else {
        setError(data.error || 'Erro ao salvar token');
      }
    } catch (err: any) {
      setError('Erro ao salvar token: ' + err.message);
    } finally {
      setSavingManualBuffer(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const response = await fetch("https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/buffer/profiles");
      const data = await response.json();
      const channels = data.data?.profiles || data.data?.account?.organizations?.flatMap((org: any) => org.channels || []) || [];
      setProfiles(channels);
      if (channels.length > 0 && !selectedProfileId) {
        setSelectedProfileId(channels[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch Buffer profiles', err);
    }
  };

  const fetchSchedule = async (id: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/buffer/schedule/${id}`);
      const data = await response.json();
      if (data.data?.node?.postingSchedules) {
        setSchedules(data.data.node.postingSchedules);
      } else {
        setSchedules([]);
      }
    } catch (err: any) {
      setError('Erro ao carregar horários: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (selectedProfileId) {
      fetchSchedule(selectedProfileId);
    }
  }, [selectedProfileId]);

  const addTime = (scheduleIdx: number) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIdx].times.push('12:00');
    setSchedules(newSchedules);
  };

  const removeTime = (scheduleIdx: number, timeIdx: number) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIdx].times = newSchedules[scheduleIdx].times.filter((_: any, i: number) => i !== timeIdx);
    setSchedules(newSchedules);
  };

  const updateTime = (scheduleIdx: number, timeIdx: number, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[scheduleIdx].times[timeIdx] = value;
    setSchedules(newSchedules);
  };

  const addSchedule = () => {
    setSchedules([...schedules, { days: ['monday'], times: ['09:00'] }]);
  };

  const removeSchedule = (idx: number) => {
    setSchedules(schedules.filter((_, i) => i !== idx));
  };

  const toggleDay = (scheduleIdx: number, day: string) => {
    const newSchedules = [...schedules];
    const days = newSchedules[scheduleIdx].days;
    if (days.includes(day)) {
      newSchedules[scheduleIdx].days = days.filter((d: string) => d !== day);
    } else {
      newSchedules[scheduleIdx].days.push(day);
    }
    setSchedules(newSchedules);
  };

  const handleSave = async () => {
    if (!selectedProfileId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/buffer/schedule-update", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: selectedProfileId,
          schedules: schedules
        })
      });
      const data = await response.json();
      if (data.data?.updatePostingSchedules?.channel) {
        setSuccess('Horários de postagem atualizados!');
      } else if (data.data?.updatePostingSchedules?.message) {
        setError(data.data.updatePostingSchedules.message);
      } else if (data.errors) {
        setError(data.errors[0].message);
      }
    } catch (err: any) {
      setError('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border bg-card shadow-lg">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Agendamento Automático
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Configure os horários em que o Buffer deve publicar automaticamente os posts da fila.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={selectedProfileId || ''} 
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.service})</option>
              ))}
            </select>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => selectedProfileId && fetchSchedule(selectedProfileId)} disabled={loading}>
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Manual Buffer Token Insertion Section */}
        <div className="mb-6 p-4 bg-muted/20 border border-dashed border-border rounded-xl space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Substituir/Bypass Token do Buffer</h4>
            <span className="text-[9px] font-mono text-muted-foreground">Status: Conectado</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Se os perfis não carregarem ou se o token atual do Buffer estiver expirado, cole seu novo token de acesso aqui.</p>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Insira o Access Token do Buffer..."
              value={manualBufferToken}
              onChange={(e) => setManualBufferToken(e.target.value)}
              className="bg-background text-xs"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSaveManualBufferToken}
              disabled={savingManualBuffer}
              className="shrink-0 h-9"
            >
              {savingManualBuffer ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar"}
            </Button>
          </div>
          {manualBufferSuccess && (
            <p className="text-[10px] font-bold text-green-600 mt-1">{manualBufferSuccess}</p>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground animate-pulse">Carregando plano de postagem...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {schedules.map((schedule, sIdx) => (
                <motion.div 
                  key={sIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-xl border border-border bg-muted/10 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Grupo de Dias {sIdx + 1}</p>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeSchedule(sIdx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <Badge 
                        key={day.value}
                        variant={schedule.days.includes(day.value) ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${schedule.days.includes(day.value) ? 'shadow-md shadow-primary/20' : 'hover:bg-primary/5'}`}
                        onClick={() => toggleDay(sIdx, day.value)}
                      >
                        {day.label}
                      </Badge>
                    ))}
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Horários de Postagem</p>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-primary hover:bg-primary/5" onClick={() => addTime(sIdx)}>
                        <Plus className="w-3 h-3" /> Adicionar Horário
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {schedule.times.sort().map((time: string, tIdx: number) => (
                        <div key={tIdx} className="group relative flex items-center gap-1 bg-background border border-border rounded-lg p-1.5 pl-2 shadow-sm">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <input 
                            type="time" 
                            value={time} 
                            onChange={(e) => updateTime(sIdx, tIdx, e.target.value)}
                            className="bg-transparent text-xs font-bold w-20 outline-none"
                          />
                          <button 
                            onClick={() => removeTime(sIdx, tIdx)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {schedules.length === 0 && (
              <div className="text-center py-12 bg-muted/5 rounded-2xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground">Nenhum horário configurado para este canal.</p>
                <Button variant="link" onClick={addSchedule}>Criar novo plano de postagem</Button>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={addSchedule}>
                <Plus className="w-4 h-4 mr-2" /> Novo Grupo de Dias
              </Button>
              <Button className="flex-1 gap-2 shadow-lg shadow-primary/20" onClick={handleSave} disabled={saving || !selectedProfileId}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Configurações
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-600 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                {success}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

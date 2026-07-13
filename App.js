import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

const LAN_API_HOST = "172.20.10.3";
const WEB_API_HOST =
  Platform.OS === "web" &&
  typeof window !== "undefined" &&
  !["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? window.location.hostname
    : "127.0.0.1";
const API_HOST = Platform.OS === "web" ? WEB_API_HOST : LAN_API_HOST;
const LOCAL_API_BASE_URL = `http://${API_HOST}:8007`;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || LOCAL_API_BASE_URL;
const APP_FONT = Platform.OS === "web" ? "Segoe UI Light, Segoe UI, Arial" : "sans-serif-light";
const LOGIN_USER = "admin";
const LOGIN_PASSWORD = "Rahim159357";

const DESTINATIONS = [
  { key: "hurghada", label: "Hurghada" },
  { key: "sharm", label: "Sharm" },
];

const MODULES = [
  { key: "dashboard", label: "Home" },
  { key: "pricing", label: "Pricing" },
  { key: "turnover", label: "Revenue" },
  { key: "contracts", label: "Contracts" },
  { key: "smart", label: "Tasks" },
  { key: "data", label: "Data Center" },
  { key: "availability", label: "Availability" },
];

const MAIN_TABS = MODULES.slice(0, 5);

const TAB_ICONS = {
  dashboard: "home-outline",
  pricing: "pricetag-outline",
  turnover: "bar-chart-outline",
  contracts: "document-text-outline",
  smart: "checkmark-circle-outline",
};

function formatNumber(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    notation: Math.abs(number) >= 1000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(number) >= 1000000 ? 1 : 0,
  }).format(number);
}

function formatMoney(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    notation: Math.abs(number) >= 1000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(number) >= 1000 ? 1 : 2,
  }).format(number);
}

function textValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function uniqueOptionValues(values, limit = 80) {
  const seen = new Set();
  const options = [];
  values.forEach((value) => {
    if (value === null || value === undefined || value === "") return;
    const option = String(value).trim();
    const key = option.toLowerCase();
    if (!option || option === "-" || seen.has(key)) return;
    seen.add(key);
    options.push(option);
  });
  return options.sort((a, b) => a.localeCompare(b)).slice(0, limit);
}

async function getJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function Pill({ active, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <View style={[styles.dot, active && styles.dotActive]} />
      <Text style={[styles.pillText, active && styles.pillTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function BottomTab({ active, label, icon, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.bottomTab}>
      <Ionicons name={icon} size={20} color={active ? "#d8aa43" : "#7e8b99"} />
      <Text style={[styles.bottomTabText, active && styles.bottomTabTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function StatCard({ label, value, sub, tone = "normal" }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, tone === "gold" && styles.goldText]} numberOfLines={1}>
        {value}
      </Text>
      {!!sub && <Text style={styles.statSub} numberOfLines={1}>{sub}</Text>}
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ title, subtitle, right, accent }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoBody}>
        <Text style={[styles.infoTitle, accent && styles.goldText]} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && <Text style={styles.infoSub} numberOfLines={2}>{subtitle}</Text>}
      </View>
      {!!right && <Text style={styles.infoRight} numberOfLines={1}>{right}</Text>}
    </View>
  );
}

function EmptyState({ message }) {
  return (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

function ReportButton({ label, url, tone = "gold", icon }) {
  return (
    <Pressable style={[styles.reportButton, styles[`reportButton_${tone}`]]} onPress={() => Linking.openURL(url)}>
      {!!icon && <Ionicons name={icon} size={16} color={tone === "excel" ? "#157347" : tone === "pdf" ? "#c0392b" : "#d8aa43"} />}
      <Text style={[styles.reportButtonText, styles[`reportButtonText_${tone}`]]}>{label}</Text>
    </Pressable>
  );
}

function filterRows(rows, search) {
  const query = search.trim().toLowerCase();
  if (!query) return rows;
  return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query));
}

function SmartTasksView({ data }) {
  const tasks = data?.tasks || [];
  return (
    <>
      <View style={styles.statsGrid}>
        <StatCard label="Revenue Health" value={`${formatNumber(data?.health)}/100`} />
        <StatCard label="Critical" value={formatNumber(data?.critical)} tone="gold" />
        <StatCard label="Important" value={formatNumber(data?.important)} />
        <StatCard label="Follow Up" value={formatNumber(data?.follow_up)} />
      </View>
      <Section title="Top Open Tasks">
        {tasks.length ? tasks.map((task, index) => (
          <View key={`${task.hotel}-${index}`} style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <Text style={[styles.taskPriority, task.priority === "CRITICAL" && styles.criticalText]}>
                {task.priority} • {task.partition}
              </Text>
              <Text style={styles.taskScore}>Impact {task.impact_score}</Text>
            </View>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.infoSub}>{task.hotel} • {task.destination}</Text>
            <Text style={styles.taskLine}>Why: {task.why}</Text>
            <Text style={styles.taskLine}>Action: {task.action}</Text>
          </View>
        )) : <EmptyState message="No open tasks for this destination." />}
      </Section>
    </>
  );
}

function InhouseHotelCard({ item }) {
  const achievement = Number(item.achievement || 0);
  const diff = Number(item.diff || 0);
  const progress = `${Math.min(Math.max(achievement || 0, 6), 100)}%`;
  const months = item.months || [];

  return (
    <View style={styles.inhouseCard}>
      <View style={styles.inhouseCardTop}>
        <View style={styles.inhouseHotelBlock}>
          <Text style={styles.inhouseHotelName} numberOfLines={2}>{item.hotel}</Text>
          <Text style={styles.inhouseMeta} numberOfLines={1}>
            Target {formatNumber(item.commitment)} • Achieved {formatNumber(item.achieved)}
          </Text>
        </View>
        <View style={styles.inhouseScoreBox}>
          <Text style={styles.inhouseScore}>{formatNumber(achievement)}%</Text>
          <Text style={styles.inhouseScoreLabel}>Achievement</Text>
        </View>
      </View>

      <View style={styles.inhouseProgressTrack}>
        <View
          style={[
            styles.inhouseProgressFill,
            diff >= 0 ? styles.inhouseProgressGood : styles.inhouseProgressBad,
            { width: progress },
          ]}
        />
      </View>

      <View style={styles.inhouseMonthGrid}>
        {months.slice(0, 5).map((month, index) => {
          const monthDiff = Number(month.diff || 0);
          return (
            <View key={`${item.hotel}-${month.month}-${index}`} style={styles.inhouseMonthBox}>
              <Text style={styles.inhouseMonthLabel} numberOfLines={1}>{month.month}</Text>
              <Text style={styles.inhouseMonthValue}>{formatNumber(month.achieved)}</Text>
              <Text
                style={[
                  styles.inhouseMonthDiff,
                  monthDiff >= 0 ? styles.positiveText : styles.negativeText,
                ]}
              >
                {monthDiff >= 0 ? "+" : ""}
                {formatNumber(monthDiff)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function DashboardView({
  pricingDashboard,
  contractSummary,
  inhouseSummary,
  hotelOptions,
  filters,
  setFilters,
  onSearch,
  onClear,
}) {
  const [isHotelFocused, setIsHotelFocused] = useState(false);
  const pricing = pricingDashboard?.pricing_kpis || {};
  const turnover = pricingDashboard?.turnover_kpis || {};
  const contract = contractSummary || {};
  const inhouse = inhouseSummary || {};
  const inhouseCards = inhouse.hotel_cards || [];
  const hotelQuery = filters.hotel.trim().toLowerCase();
  const suggestions = (hotelOptions || [])
    .filter((hotel) => !hotelQuery || hotel.toLowerCase().includes(hotelQuery))
    .slice(0, hotelQuery ? 10 : 12);
  const showSuggestions = isHotelFocused && !!suggestions.length;

  return (
    <>
      <View style={styles.homeIntro}>
        <View>
          <Text style={styles.greetingText}>Good Morning, Mahmoud</Text>
          <Text style={styles.greetingSub}>Here's what's happening today</Text>
        </View>
        <View style={styles.destinationChip}>
          <Text style={styles.destinationChipText}>Current</Text>
          <Ionicons name="chevron-down" size={14} color="#1b2430" />
        </View>
      </View>

      <View style={styles.homeKpiGrid}>
        <StatCard label="Revenue Today" value={formatMoney(turnover.revenue)} sub="vs yesterday" tone="gold" />
        <StatCard label="Profit Today" value={formatMoney(turnover.profit)} sub="vs yesterday" tone="red" />
        <StatCard label="Hotels" value={formatNumber(pricing.total_hotels)} />
        <StatCard label="Active SPO" value={formatNumber(pricing.valid_hotels)} />
        <StatCard label="Critical Alerts" value={formatNumber(pricing.expired_hotels)} tone="red" />
      </View>

      <View style={styles.pricingSearchBox}>
        <Text style={styles.dashboardTitle}>Dashboard</Text>
        <View style={styles.searchGrid}>
          <View style={styles.searchFieldWide}>
            <Text style={styles.inputLabel}>Hotel Name</Text>
            <TextInput
              value={filters.hotel}
              onChangeText={(value) => setFilters((prev) => ({ ...prev, hotel: value }))}
              onFocus={() => setIsHotelFocused(true)}
              placeholder="Start typing hotel name..."
              placeholderTextColor="#718397"
              style={styles.input}
            />
            {showSuggestions && (
              <View style={styles.suggestionBox}>
                {suggestions.map((hotel) => (
                  <Pressable
                    key={hotel}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setFilters((prev) => ({ ...prev, hotel }));
                      setIsHotelFocused(false);
                    }}
                  >
                    <Text style={styles.suggestionText} numberOfLines={1}>{hotel}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          <View style={styles.searchField}>
            <Text style={styles.inputLabel}>Date From</Text>
            <TextInput
              value={filters.dateFrom}
              onChangeText={(value) => setFilters((prev) => ({ ...prev, dateFrom: value }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#718397"
              style={styles.input}
            />
          </View>
          <View style={styles.searchField}>
            <Text style={styles.inputLabel}>Date To</Text>
            <TextInput
              value={filters.dateTo}
              onChangeText={(value) => setFilters((prev) => ({ ...prev, dateTo: value }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#718397"
              style={styles.input}
            />
          </View>
        </View>
        <View style={styles.searchActions}>
          <Pressable style={styles.searchButton} onPress={onSearch}>
            <Text style={styles.searchButtonText}>Search Dashboard</Text>
          </Pressable>
          <Pressable style={styles.clearButton} onPress={onClear}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.kpiSectionHeader}>
        <Text style={styles.kpiSectionTitle}>Pricing KPIs</Text>
      </View>
      <View style={styles.kpiGrid}>
        <KpiTile label="Total Hotels" value={formatNumber(pricing.total_hotels)} sub="Pricing scope" tone="gold" />
        <KpiTile label="Hotels With Offers" value={formatNumber(pricing.hotels_with_offers)} sub="Has active offers" />
        <KpiTile label="Without Offers" value={formatNumber(pricing.hotels_without_offers)} sub="No offer rows" tone="red" />
        <KpiTile label="Valid SPO" value={formatNumber(pricing.valid_hotels)} sub="Full offer coverage" />
        <KpiTile label="Partial SPO" value={formatNumber(pricing.partial_coverage)} sub="Offer gaps vs contract" tone="gold" />
        <KpiTile label="Expired SPO" value={formatNumber(pricing.expired_hotels)} sub="0-4 days left" tone="red" />
      </View>

      <View style={styles.kpiSectionHeader}>
        <Text style={styles.kpiSectionTitle}>Turnover KPIs</Text>
      </View>
      <View style={styles.kpiGrid}>
        <KpiTile label="Revenue" value={formatMoney(turnover.revenue)} sub="Filtered turnover" tone="gold" />
        <KpiTile label="Room Nights" value={formatNumber(turnover.room_nights)} sub="Total nights" tone="blue" />
        <KpiTile label="Cost" value={formatMoney(turnover.cost)} sub="Buying cost" tone="red" />
        <KpiTile label="Profit" value={formatMoney(turnover.profit)} sub="Revenue - cost" />
        <KpiTile label="Profit %" value={`${formatMoney(turnover.profit_percent)}%`} sub="Margin" />
        <KpiTile label="Bookings" value={formatNumber(turnover.bookings)} sub="Reservations" tone="blue" />
        <KpiTile label="Pax" value={formatNumber(turnover.pax)} sub="Adult + child" />
        <KpiTile label="Avg Booking" value={formatMoney(turnover.avg_booking)} sub="Revenue / bookings" tone="gold" />
      </View>

      <View style={styles.kpiSectionHeader}>
        <Text style={styles.kpiSectionTitle}>Contract Situation KPIs</Text>
      </View>
      <View style={styles.kpiGrid}>
        <KpiTile label="Proposal" value={formatNumber(contract.proposal)} sub="F/Y done" tone="gold" />
        <KpiTile label="Draft" value={formatNumber(contract.draft)} sub="Y done" tone="blue" />
        <KpiTile label="Sent HTL" value={formatNumber(contract.sent_to_htl)} sub="Y done" tone="blue" />
        <KpiTile label="Signed HT" value={formatNumber(contract.signed_ht)} sub="Y done" />
        <KpiTile label="Signed Company" value={formatNumber(contract.signed_company)} sub="Y done" tone="blue" />
        <KpiTile label="Sejour" value={formatNumber(contract.sejour)} sub="Y/W/C/F done" tone="red" />
      </View>

      <View style={styles.kpiSectionHeader}>
        <Text style={styles.kpiSectionTitle}>Inhouse KPIs</Text>
      </View>
      <View style={styles.kpiGrid}>
        <KpiTile label="Lowest Month" value={inhouse.lowest_month || "No Data"} sub={`Avg ${formatNumber(inhouse.lowest_month_rooms)} Rooms`} tone="red" />
        <KpiTile label="Lowest Hotel Occupancy" value={inhouse.lowest_hotel || "No Data"} sub={`Avg ${formatNumber(inhouse.lowest_hotel_rooms)} Rooms`} tone="gold" />
        <KpiTile label="Highest Month" value={inhouse.highest_month || "No Data"} sub={`Avg ${formatNumber(inhouse.highest_month_rooms)} Rooms`} />
        <KpiTile label="Highest Hotel Occupancy" value={inhouse.highest_hotel || "No Data"} sub={`Avg ${formatNumber(inhouse.highest_hotel_rooms)} Rooms`} tone="blue" />
      </View>
      {inhouseCards.length ? (
        <View style={styles.inhouseCardsWrap}>
          {inhouseCards.slice(0, 12).map((item) => (
            <InhouseHotelCard key={item.hotel} item={item} />
          ))}
        </View>
      ) : !inhouse.rows && (
        <View style={styles.noticeBar}>
          <Text style={styles.noticeText}>No inhouse hotel data available.</Text>
        </View>
      )}
    </>
  );
}

function KpiTile({ label, value, sub, active, tone = "normal", onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.kpiTile, active && styles.kpiTileActive]}
    >
      <View style={[styles.kpiIcon, tone === "red" && styles.kpiIconRed, tone === "blue" && styles.kpiIconBlue]}>
        <Text style={[styles.kpiIconText, tone === "red" && styles.criticalText]}>
          {label.charAt(0)}
        </Text>
      </View>
      <View style={styles.kpiBody}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, tone === "gold" && styles.goldText]} numberOfLines={1}>
          {value}
        </Text>
        {!!sub && <Text style={styles.statSub} numberOfLines={1}>{sub}</Text>}
      </View>
    </Pressable>
  );
}

function SmartSearchField({
  name,
  label,
  value,
  placeholder,
  options = [],
  focusedField,
  setFocusedField,
  setFilters,
  keyboardType = "default",
  onSubmit,
}) {
  const query = value.trim().toLowerCase();
  const suggestions = options
    .filter((option) => !query || option.toLowerCase().includes(query))
    .slice(0, query ? 10 : 12);
  const isFocused = focusedField === name;

  return (
    <View style={[styles.pricingFilterField, name === "hotel" && styles.pricingFilterFieldFull]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(nextValue) => setFilters((prev) => ({ ...prev, [name]: nextValue }))}
        onFocus={() => setFocusedField(name)}
        placeholder={placeholder}
        placeholderTextColor="#718397"
        style={styles.input}
        keyboardType={keyboardType}
        onSubmitEditing={onSubmit}
      />
      {isFocused && !!suggestions.length && (
        <View style={styles.suggestionBox}>
          {suggestions.map((option) => (
            <Pressable
              key={`${name}-${option}`}
              style={styles.suggestionItem}
              onPress={() => {
                setFilters((prev) => ({ ...prev, [name]: option }));
                setFocusedField("");
              }}
            >
              <Text style={styles.suggestionText} numberOfLines={1}>{option}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function PricingView({ dashboard, hotelOptions, filters, setFilters, onSearch, onClear }) {
  const [focusedField, setFocusedField] = useState("");
  const [mailPanelOpen, setMailPanelOpen] = useState(false);
  const [mailAddress, setMailAddress] = useState("");
  const [mailFormat, setMailFormat] = useState("xlsx");
  const [savedMails, setSavedMails] = useState([]);
  const rows = dashboard?.rows || [];
  const pricing = dashboard?.pricing_kpis || {};
  const params = [];
  if (filters.hotel.trim()) params.push(`hotel=${encodeURIComponent(filters.hotel.trim())}`);
  if (filters.stars.trim()) params.push(`stars=${encodeURIComponent(filters.stars.trim())}`);
  if (filters.dateFrom.trim()) params.push(`date_from=${encodeURIComponent(filters.dateFrom.trim())}`);
  if (filters.dateTo.trim()) params.push(`date_to=${encodeURIComponent(filters.dateTo.trim())}`);
  if (filters.room.trim()) params.push(`room=${encodeURIComponent(filters.room.trim())}`);
  if (filters.board.trim()) params.push(`board=${encodeURIComponent(filters.board.trim())}`);
  if (filters.price.trim()) params.push(`price=${encodeURIComponent(filters.price.trim())}`);
  const query = params.length ? `?${params.join("&")}` : "";
  const pricingExcelUrl = `${API_BASE_URL}/export/pricing/${dashboard?.destination || "Hurghada"}.xlsx${query}`;
  const pricingPdfUrl = `${API_BASE_URL}/export/pricing/${dashboard?.destination || "Hurghada"}.pdf${query}`;
  const selectedMailUrl = mailFormat === "pdf" ? pricingPdfUrl : pricingExcelUrl;
  const roomOptions = uniqueOptionValues(rows.map((row) => row["Room Type"]));
  const boardOptions = uniqueOptionValues(rows.map((row) => row.Board));
  const starOptions = ["5", "4", "3", "2", "1"];
  const priceOptions = uniqueOptionValues(
    rows.flatMap((row) => [row.Selling, row.Buying, row["Contract Rate"]])
      .filter((value) => value !== null && value !== undefined && value !== "")
      .map((value) => String(Math.round(Number(value))))
      .filter((value) => value !== "NaN"),
    24
  );
  const sendReportByMail = useCallback(() => {
    const email = mailAddress.trim();
    if (!email) return;
    const nextSaved = [email, ...savedMails.filter((item) => item.toLowerCase() !== email.toLowerCase())].slice(0, 8);
    setSavedMails(nextSaved);
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem("khateeb_report_mails", JSON.stringify(nextSaved));
    }
    const subject = encodeURIComponent(`Pricing ${mailFormat.toUpperCase()} Report`);
    const body = encodeURIComponent(`Hello,\n\nPlease download the ${mailFormat.toUpperCase()} pricing report from this link:\n${selectedMailUrl}`);
    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
  }, [mailAddress, mailFormat, savedMails, selectedMailUrl]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    try {
      const stored = JSON.parse(window.localStorage.getItem("khateeb_report_mails") || "[]");
      if (Array.isArray(stored)) setSavedMails(stored.filter(Boolean).slice(0, 8));
    } catch {
      setSavedMails([]);
    }
  }, []);

  return (
    <>
      <View style={styles.mobileScreenHeader}>
        <Text style={styles.mobileScreenTitle}>Pricing Center</Text>
        <Pressable style={styles.roundIconButton} onPress={onSearch}>
          <Ionicons name="options-outline" size={20} color="#1b2430" />
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#9aa3ad" />
        <TextInput
          value={filters.hotel}
          onChangeText={(value) => setFilters((prev) => ({ ...prev, hotel: value }))}
          onFocus={() => setFocusedField("hotel")}
          placeholder="Search hotel..."
          placeholderTextColor="#9aa3ad"
          style={styles.searchBarInput}
          onSubmitEditing={onSearch}
        />
      </View>
      {focusedField === "hotel" && !!hotelOptions?.length && (
        <View style={styles.pricingTopSuggestions}>
          {hotelOptions
            .filter((hotel) => !filters.hotel.trim() || hotel.toLowerCase().includes(filters.hotel.trim().toLowerCase()))
            .slice(0, filters.hotel.trim() ? 10 : 12)
            .map((hotel) => (
              <Pressable
                key={hotel}
                style={styles.suggestionItem}
                onPress={() => {
                  setFilters((prev) => ({ ...prev, hotel }));
                  setFocusedField("");
                }}
              >
                <Text style={styles.suggestionText} numberOfLines={1}>{hotel}</Text>
              </Pressable>
            ))}
        </View>
      )}

      <View style={styles.pricingFiltersBox}>
        <View style={styles.pricingFiltersGrid}>
          <SmartSearchField
            name="stars"
            label="Stars"
            value={filters.stars}
            placeholder="All stars"
            options={starOptions}
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            setFilters={setFilters}
            keyboardType="numeric"
            onSubmit={onSearch}
          />
          <SmartSearchField
            name="room"
            label="Room Name"
            value={filters.room}
            placeholder="Start typing room..."
            options={roomOptions}
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            setFilters={setFilters}
            onSubmit={onSearch}
          />
          <SmartSearchField
            name="board"
            label="Meal Plan"
            value={filters.board}
            placeholder="Start typing meal..."
            options={boardOptions}
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            setFilters={setFilters}
            onSubmit={onSearch}
          />
          <SmartSearchField
            name="dateFrom"
            label="Date From"
            value={filters.dateFrom}
            placeholder="YYYY-MM-DD"
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            setFilters={setFilters}
            onSubmit={onSearch}
          />
          <SmartSearchField
            name="dateTo"
            label="Date To"
            value={filters.dateTo}
            placeholder="YYYY-MM-DD"
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            setFilters={setFilters}
            onSubmit={onSearch}
          />
          <SmartSearchField
            name="price"
            label="Price"
            value={filters.price}
            placeholder="Search price..."
            options={priceOptions}
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            setFilters={setFilters}
            keyboardType="numeric"
            onSubmit={onSearch}
          />
        </View>
        <View style={styles.searchActions}>
          <Pressable style={styles.searchButton} onPress={onSearch}>
            <Text style={styles.searchButtonText}>Search Pricing</Text>
          </Pressable>
          <Pressable style={styles.clearButton} onPress={onClear}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.contractReportBox}>
        <ReportButton label="Excel" icon="document-text-outline" tone="excel" url={pricingExcelUrl} />
        <ReportButton label="PDF" icon="document-outline" tone="pdf" url={pricingPdfUrl} />
        <Pressable style={styles.mailButton} onPress={() => setMailPanelOpen((value) => !value)}>
          <Ionicons name="send-outline" size={16} color="#1b2430" />
          <Text style={styles.mailButtonText}>Send by mail</Text>
        </Pressable>
      </View>

      {mailPanelOpen && (
        <View style={styles.mailPanel}>
          <Text style={styles.inputLabel}>Recipient Email</Text>
          <TextInput
            value={mailAddress}
            onChangeText={setMailAddress}
            placeholder="example@email.com"
            placeholderTextColor="#718397"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          {!!savedMails.length && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedMailRow}>
              {savedMails.map((email) => (
                <Pressable key={email} style={styles.savedMailChip} onPress={() => setMailAddress(email)}>
                  <Text style={styles.savedMailText}>{email}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
          <Text style={styles.inputLabel}>File Type</Text>
          <View style={styles.mailFormatRow}>
            <Pressable
              style={[styles.mailFormatButton, mailFormat === "xlsx" && styles.mailFormatButtonActiveExcel]}
              onPress={() => setMailFormat("xlsx")}
            >
              <Text style={[styles.mailFormatText, mailFormat === "xlsx" && styles.mailFormatTextExcel]}>Excel</Text>
            </Pressable>
            <Pressable
              style={[styles.mailFormatButton, mailFormat === "pdf" && styles.mailFormatButtonActivePdf]}
              onPress={() => setMailFormat("pdf")}
            >
              <Text style={[styles.mailFormatText, mailFormat === "pdf" && styles.mailFormatTextPdf]}>PDF</Text>
            </Pressable>
          </View>
          <Pressable style={styles.sendMailConfirm} onPress={sendReportByMail}>
            <Text style={styles.searchButtonText}>Send</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.pricingKpiGrid}>
        <StatCard label="Total Hotels" value={formatNumber(pricing.total_hotels)} />
        <StatCard label="Valid SPO" value={formatNumber(pricing.valid_hotels)} />
        <StatCard label="Expired" value={formatNumber(pricing.expired_hotels)} tone="red" />
        <StatCard label="Increase" value={formatNumber(pricing.hotels_with_offers)} />
        <StatCard label="Decrease" value={formatNumber(pricing.hotels_without_offers)} tone="red" />
        <StatCard label="Partial" value={formatNumber(pricing.partial_coverage)} tone="gold" />
      </View>

      <Section title={`Hotels (${formatNumber(dashboard?.matched_rows)} rows)`}>
        {rows.length ? rows.map((row, index) => (
          <Pressable
            key={`${textValue(row.Hotel || row["Hotel Name"])}-${textValue(row["Room Type"])}-${index}`}
            style={styles.pricingListCard}
          >
            <View style={styles.hotelThumb}>
              <Ionicons name="business-outline" size={24} color="#d8aa43" />
            </View>
            <View style={styles.pricingListBody}>
              <View style={styles.pricingListHeader}>
                <Text style={styles.pricingListHotel} numberOfLines={1}>{textValue(row.Hotel)}</Text>
                <Text style={styles.ratingText}>★★★★★</Text>
              </View>
              <Text style={styles.pricingListMeta} numberOfLines={1}>
                {textValue(row["Room Type"])} • {textValue(row.Board)}
              </Text>
              <View style={styles.priceMiniGrid}>
                <View>
                  <Text style={styles.miniLabel}>Contract</Text>
                  <Text style={styles.miniValue}>{row["Contract Rate"] ? formatMoney(row["Contract Rate"]) : "-"}</Text>
                </View>
                <View>
                  <Text style={styles.miniLabel}>Offer</Text>
                  <Text style={[styles.miniValue, styles.goldText]}>{row.Selling ? formatMoney(row.Selling) : "-"}</Text>
                </View>
                <View>
                  <Text style={styles.miniLabel}>Days Left</Text>
                  <Text style={styles.miniValue}>{textValue(row["Days Left"])}</Text>
                </View>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {Number(row["Days Left"] || 0) <= 4 ? "EXPIRED" : row.Selling ? "VALID" : "PARTIAL"}
              </Text>
            </View>
          </Pressable>
        )) : <EmptyState message="No pricing rows found." />}
      </Section>
    </>
  );
}

function TurnoverView({ summary, rows, destination, hotelOptions, filters, setFilters, onSearch, onClear }) {
  const [focusedField, setFocusedField] = useState("");
  const [mailPanelOpen, setMailPanelOpen] = useState(false);
  const [mailAddress, setMailAddress] = useState("");
  const [mailFormat, setMailFormat] = useState("xlsx");
  const [savedMails, setSavedMails] = useState([]);
  const params = [];
  if (filters.hotel.trim()) params.push(`hotel=${encodeURIComponent(filters.hotel.trim())}`);
  if (filters.dateFrom.trim()) params.push(`date_from=${encodeURIComponent(filters.dateFrom.trim())}`);
  if (filters.dateTo.trim()) params.push(`date_to=${encodeURIComponent(filters.dateTo.trim())}`);
  const query = params.length ? `?${params.join("&")}` : "";
  const salesExcelUrl = `${API_BASE_URL}/export/sales/${destination}.xlsx${query}`;
  const salesPdfUrl = `${API_BASE_URL}/export/sales/${destination}.pdf${query}`;
  const selectedMailUrl = mailFormat === "pdf" ? salesPdfUrl : salesExcelUrl;

  const sendReportByMail = useCallback(() => {
    const email = mailAddress.trim();
    if (!email) return;
    const nextSaved = [email, ...savedMails.filter((item) => item.toLowerCase() !== email.toLowerCase())].slice(0, 8);
    setSavedMails(nextSaved);
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem("khateeb_report_mails", JSON.stringify(nextSaved));
    }
    const subject = encodeURIComponent(`Revenue ${mailFormat.toUpperCase()} Report`);
    const body = encodeURIComponent(`Hello,\n\nPlease download the ${mailFormat.toUpperCase()} revenue report from this link:\n${selectedMailUrl}`);
    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
  }, [mailAddress, mailFormat, savedMails, selectedMailUrl]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    try {
      const stored = JSON.parse(window.localStorage.getItem("khateeb_report_mails") || "[]");
      if (Array.isArray(stored)) setSavedMails(stored.filter(Boolean).slice(0, 8));
    } catch {
      setSavedMails([]);
    }
  }, []);

  return (
    <>
      <View style={styles.pricingFiltersBox}>
        <Text style={styles.inputLabel}>Revenue Search</Text>
        <SmartSearchField
          name="hotel"
          label="Hotel Name"
          value={filters.hotel}
          placeholder="Start typing hotel name..."
          options={hotelOptions}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
          setFilters={setFilters}
          onSubmit={onSearch}
        />
        <View style={styles.revenueDateGrid}>
          <SmartSearchField
            name="dateFrom"
            label="Check In From"
            value={filters.dateFrom}
            placeholder="YYYY-MM-DD"
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            setFilters={setFilters}
            onSubmit={onSearch}
          />
          <SmartSearchField
            name="dateTo"
            label="Check In To"
            value={filters.dateTo}
            placeholder="YYYY-MM-DD"
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            setFilters={setFilters}
            onSubmit={onSearch}
          />
        </View>
        <View style={styles.searchActions}>
          <Pressable style={styles.searchButton} onPress={onSearch}>
            <Text style={styles.searchButtonText}>Search Revenue</Text>
          </Pressable>
          <Pressable style={styles.clearButton} onPress={onClear}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.contractReportBox}>
        <ReportButton label="Excel" icon="document-text-outline" tone="excel" url={salesExcelUrl} />
        <ReportButton label="PDF" icon="document-outline" tone="pdf" url={salesPdfUrl} />
        <Pressable style={styles.mailButton} onPress={() => setMailPanelOpen((value) => !value)}>
          <Ionicons name="send-outline" size={16} color="#1b2430" />
          <Text style={styles.mailButtonText}>Send by mail</Text>
        </Pressable>
      </View>

      {mailPanelOpen && (
        <View style={styles.mailPanel}>
          <Text style={styles.inputLabel}>Recipient Email</Text>
          <TextInput
            value={mailAddress}
            onChangeText={setMailAddress}
            placeholder="example@email.com"
            placeholderTextColor="#718397"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          {!!savedMails.length && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedMailRow}>
              {savedMails.map((email) => (
                <Pressable key={email} style={styles.savedMailChip} onPress={() => setMailAddress(email)}>
                  <Text style={styles.savedMailText}>{email}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
          <Text style={styles.inputLabel}>File Type</Text>
          <View style={styles.mailFormatRow}>
            <Pressable
              style={[styles.mailFormatButton, mailFormat === "xlsx" && styles.mailFormatButtonActiveExcel]}
              onPress={() => setMailFormat("xlsx")}
            >
              <Text style={[styles.mailFormatText, mailFormat === "xlsx" && styles.mailFormatTextExcel]}>Excel</Text>
            </Pressable>
            <Pressable
              style={[styles.mailFormatButton, mailFormat === "pdf" && styles.mailFormatButtonActivePdf]}
              onPress={() => setMailFormat("pdf")}
            >
              <Text style={[styles.mailFormatText, mailFormat === "pdf" && styles.mailFormatTextPdf]}>PDF</Text>
            </Pressable>
          </View>
          <Pressable style={styles.sendMailConfirm} onPress={sendReportByMail}>
            <Text style={styles.searchButtonText}>Send</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.statsGrid}>
        <StatCard label="Sales Rows" value={formatNumber(summary?.rows)} />
        <StatCard label="Vouchers" value={formatNumber(summary?.vouchers)} />
        <StatCard label="Room Nights" value={formatNumber(summary?.room_nights)} />
        <StatCard label="Total Sales" value={formatMoney(summary?.total_sales)} tone="gold" />
        <StatCard label="Total Buying" value={formatMoney(summary?.total_buying)} />
        <StatCard label="Profit" value={formatMoney(summary?.profit)} tone="gold" />
      </View>
      <Section title="Top Hotels">
        {(summary?.top_hotels || []).length ? summary.top_hotels.map((item, index) => (
          <InfoRow
            key={`${item.hotel}-${index}`}
            title={textValue(item.hotel)}
            subtitle={`Rooms ${formatNumber(item.rooms)} • Profit ${formatMoney(item.profit)}`}
            right={formatMoney(item.total_sales)}
            accent
          />
        )) : <EmptyState message="No turnover file for this destination yet." />}
      </Section>
      <Section title="Latest Sales Rows">
        {rows.length ? rows.map((row, index) => (
          <InfoRow
            key={`${row.Voucher}-${index}`}
            title={textValue(row["Hotel Name"] || row.Hotel)}
            subtitle={`${textValue(row["Operator Name"] || row.Operator)} • Voucher ${textValue(row.Voucher)}`}
            right={row["Total Selling Inv."] ? formatMoney(row["Total Selling Inv."]) : "-"}
            accent={!!row["Total Selling Inv."]}
          />
        )) : <EmptyState message="No sales rows to show." />}
      </Section>
    </>
  );
}

function ContractSituationView({ summary, rows, destination }) {
  const [filters, setFilters] = useState({ hotel: "", status: "", stars: "" });
  const [focusedField, setFocusedField] = useState("");
  const [mailPanelOpen, setMailPanelOpen] = useState(false);
  const [mailAddress, setMailAddress] = useState("");
  const [mailFormat, setMailFormat] = useState("xlsx");
  const [savedMails, setSavedMails] = useState([]);
  const hotelOptions = uniqueOptionValues(rows.map((row) => row.HOTEL));
  const statusOptions = uniqueOptionValues(rows.flatMap((row) => [row["HOTEL STATUS"], row.STATUE]));
  const starOptions = uniqueOptionValues(rows.map((row) => row.STAR), 12);
  const contractExcelUrl = `${API_BASE_URL}/export/contracts/${destination}.xlsx`;
  const contractPdfUrl = `${API_BASE_URL}/export/contracts/${destination}.pdf`;
  const selectedMailUrl = mailFormat === "pdf" ? contractPdfUrl : contractExcelUrl;
  const filteredRows = rows.filter((row) => {
    const hotel = textValue(row.HOTEL).toLowerCase();
    const status = `${textValue(row["HOTEL STATUS"])} ${textValue(row.STATUE)}`.toLowerCase();
    const stars = textValue(row.STAR).toLowerCase();
    return (
      (!filters.hotel.trim() || hotel.includes(filters.hotel.trim().toLowerCase())) &&
      (!filters.status.trim() || status.includes(filters.status.trim().toLowerCase())) &&
      (!filters.stars.trim() || stars.includes(filters.stars.trim().toLowerCase()))
    );
  });
  const sendReportByMail = useCallback(() => {
    const email = mailAddress.trim();
    if (!email) return;
    const nextSaved = [email, ...savedMails.filter((item) => item.toLowerCase() !== email.toLowerCase())].slice(0, 8);
    setSavedMails(nextSaved);
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.localStorage.setItem("khateeb_report_mails", JSON.stringify(nextSaved));
    }
    const subject = encodeURIComponent(`Contracts ${mailFormat.toUpperCase()} Report`);
    const body = encodeURIComponent(`Hello,\n\nPlease download the ${mailFormat.toUpperCase()} contracts report from this link:\n${selectedMailUrl}`);
    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
  }, [mailAddress, mailFormat, savedMails, selectedMailUrl]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    try {
      const stored = JSON.parse(window.localStorage.getItem("khateeb_report_mails") || "[]");
      if (Array.isArray(stored)) setSavedMails(stored.filter(Boolean).slice(0, 8));
    } catch {
      setSavedMails([]);
    }
  }, []);

  return (
    <>
      <View style={styles.pricingFiltersBox}>
        <Text style={styles.inputLabel}>Contracts Search</Text>
        <SmartSearchField
          name="hotel"
          label="Hotel Name"
          value={filters.hotel}
          placeholder="Start typing hotel name..."
          options={hotelOptions}
          focusedField={focusedField}
          setFocusedField={setFocusedField}
          setFilters={setFilters}
        />
        <View style={styles.revenueDateGrid}>
          <SmartSearchField
            name="status"
            label="Status"
            value={filters.status}
            placeholder="Draft, signed, proposal..."
            options={statusOptions}
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            setFilters={setFilters}
          />
          <SmartSearchField
            name="stars"
            label="Stars"
            value={filters.stars}
            placeholder="All stars"
            options={starOptions}
            focusedField={focusedField}
            setFocusedField={setFocusedField}
            setFilters={setFilters}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.searchActions}>
          <Pressable style={[styles.clearButton, styles.contractClearButton]} onPress={() => setFilters({ hotel: "", status: "", stars: "" })}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.contractReportBox}>
        <ReportButton label="Excel" icon="document-text-outline" tone="excel" url={contractExcelUrl} />
        <ReportButton label="PDF" icon="document-outline" tone="pdf" url={contractPdfUrl} />
        <Pressable style={styles.mailButton} onPress={() => setMailPanelOpen((value) => !value)}>
          <Ionicons name="send-outline" size={16} color="#1b2430" />
          <Text style={styles.mailButtonText}>Send by mail</Text>
        </Pressable>
      </View>

      {mailPanelOpen && (
        <View style={styles.mailPanel}>
          <Text style={styles.inputLabel}>Recipient Email</Text>
          <TextInput
            value={mailAddress}
            onChangeText={setMailAddress}
            placeholder="example@email.com"
            placeholderTextColor="#718397"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          {!!savedMails.length && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedMailRow}>
              {savedMails.map((email) => (
                <Pressable key={email} style={styles.savedMailChip} onPress={() => setMailAddress(email)}>
                  <Text style={styles.savedMailText}>{email}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
          <Text style={styles.inputLabel}>File Type</Text>
          <View style={styles.mailFormatRow}>
            <Pressable
              style={[styles.mailFormatButton, mailFormat === "xlsx" && styles.mailFormatButtonActiveExcel]}
              onPress={() => setMailFormat("xlsx")}
            >
              <Text style={[styles.mailFormatText, mailFormat === "xlsx" && styles.mailFormatTextExcel]}>Excel</Text>
            </Pressable>
            <Pressable
              style={[styles.mailFormatButton, mailFormat === "pdf" && styles.mailFormatButtonActivePdf]}
              onPress={() => setMailFormat("pdf")}
            >
              <Text style={[styles.mailFormatText, mailFormat === "pdf" && styles.mailFormatTextPdf]}>PDF</Text>
            </Pressable>
          </View>
          <Pressable style={styles.sendMailConfirm} onPress={sendReportByMail}>
            <Text style={styles.searchButtonText}>Send</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.statsGrid}>
        <StatCard label="Rows" value={formatNumber(summary?.rows)} />
        <StatCard label="Hotels" value={formatNumber(summary?.hotels)} />
        <StatCard label="Draft" value={formatNumber(summary?.draft)} />
        <StatCard label="Signed HT" value={formatNumber(summary?.signed_ht)} tone="gold" />
        <StatCard label="Signed Company" value={formatNumber(summary?.signed_company)} />
        <StatCard label="Proposal" value={formatNumber(summary?.proposal)} />
      </View>
      <Section title="Contract Situation">
        {filteredRows.length ? filteredRows.map((row, index) => (
          <InfoRow
            key={`${row.HOTEL}-${index}`}
            title={textValue(row.HOTEL)}
            subtitle={`${textValue(row.RESORT)} • ${textValue(row["HOTEL STATUS"])} • ${textValue(row.STATUE)}`}
            right={textValue(row.STAR)}
          />
        )) : <EmptyState message="No contract situation rows." />}
      </Section>
    </>
  );
}

function DataCenterView({ data }) {
  return (
    <>
      <View style={styles.statsGrid}>
        <StatCard label="Datasets" value={formatNumber(data?.count)} />
        <StatCard label="Total Rows" value={formatNumber(data?.total_rows)} tone="gold" />
      </View>
      <Section title="Data Files">
        {(data?.datasets || []).map((item, index) => (
          <InfoRow
            key={`${item.folder}-${item.name}-${index}`}
            title={item.name}
            subtitle={`${item.folder} • ${formatNumber(item.columns)} columns • ${item.fields?.join(", ") || "No fields"}`}
            right={formatNumber(item.rows)}
            accent={item.rows > 0}
          />
        ))}
      </Section>
    </>
  );
}

function AvailabilityView({ data }) {
  return (
    <>
      <View style={styles.statsGrid}>
        <StatCard label="Hotels" value={formatNumber(data?.hotels)} />
        <StatCard label="Rows" value={formatNumber((data?.rows || []).length)} />
      </View>
      <Section title="Availability Monitor">
        {(data?.rows || []).map((row, index) => (
          <InfoRow
            key={`${row.Hotel}-${index}`}
            title={textValue(row.Hotel)}
            subtitle={`Contract rows ${formatNumber(row.contract_rows)} • Offer rows ${formatNumber(row.offer_rows)}`}
            right={formatNumber(row.total_rows)}
            accent
          />
        ))}
      </Section>
    </>
  );
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState("");

  const submitLogin = useCallback(() => {
    if (username.trim() === LOGIN_USER && password === LOGIN_PASSWORD) {
      setLoginError("");
      onLogin();
      return;
    }
    setLoginError("Invalid username or password");
  }, [onLogin, password, username]);

  return (
    <SafeAreaView style={styles.loginExactSafeArea}>
      <StatusBar style="dark" />
      <ImageBackground
        source={require("./assets/login-screen.png")}
        resizeMode="contain"
        style={styles.loginExactFrame}
        imageStyle={styles.loginExactImage}
      >
        <TextInput
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholder=""
          style={[styles.loginExactInput, styles.loginExactUsername]}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholder=""
          style={[styles.loginExactInput, styles.loginExactPassword]}
          onSubmitEditing={submitLogin}
        />
        <Pressable
          accessibilityLabel="Show password"
          style={styles.loginExactEye}
          onPress={() => setShowPassword((value) => !value)}
        />
        <Pressable
          accessibilityLabel="Remember me"
          style={styles.loginExactRemember}
          onPress={() => setRememberMe((value) => !value)}
        >
          {rememberMe && <Ionicons name="checkmark" size={14} color="#d8aa43" />}
        </Pressable>
        {!!loginError && <Text style={styles.loginExactError}>{loginError}</Text>}
        <Pressable accessibilityLabel="Login" style={styles.loginExactButton} onPress={submitLogin} />
        <Pressable accessibilityLabel="Face ID" style={styles.loginExactFace} />
        <Pressable accessibilityLabel="Fingerprint" style={styles.loginExactFingerprint} />
      </ImageBackground>
    </SafeAreaView>
  );
}

function DrawerMenu({ activeModule, onNavigate, onClose, onLogout }) {
  const items = [
    { label: "Home", icon: "home-outline", module: "dashboard" },
    { label: "Availability", icon: "calendar-outline", module: "availability" },
    { label: "Flight", icon: "airplane-outline" },
    { label: "Alert Center", icon: "notifications-outline", module: "smart" },
    { label: "Data Center", icon: "server-outline", module: "data" },
    { label: "Sent Mail", icon: "paper-plane-outline" },
  ];

  return (
    <View style={styles.drawerOverlay}>
      <Pressable style={styles.drawerBackdrop} onPress={onClose} />
      <View style={styles.drawerPanel}>
        <View style={styles.drawerProfile}>
          <View style={styles.drawerAvatar}>
            <Text style={styles.drawerAvatarText}>ME</Text>
          </View>
          <View>
            <Text style={styles.drawerName}>Mahmoud Elkhateeb</Text>
            <Text style={styles.drawerRole}>Admin</Text>
          </View>
        </View>

        <View style={styles.drawerDivider} />

        <View style={styles.drawerItems}>
          {items.map((item) => {
            const active = item.module && activeModule === item.module;
            return (
              <Pressable
                key={item.label}
                style={[styles.drawerItem, active && styles.drawerItemActive]}
                onPress={() => item.module && onNavigate(item.module)}
              >
                <View style={[styles.drawerIconBox, active && styles.drawerIconBoxActive]}>
                  <Ionicons name={item.icon} size={22} color={active ? "#d8aa43" : "#ffffff"} />
                </View>
                <Text style={[styles.drawerItemText, active && styles.drawerItemTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.drawerDivider} />

        <Pressable style={styles.drawerLogout} onPress={onLogout}>
          <View style={styles.drawerIconBox}>
            <Ionicons name="log-out-outline" size={22} color="#ffffff" />
          </View>
          <Text style={styles.drawerItemText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [destination, setDestination] = useState("hurghada");
  const [module, setModule] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [dashboardFilters, setDashboardFilters] = useState({ hotel: "", dateFrom: "", dateTo: "" });
  const [dashboardSearchVersion, setDashboardSearchVersion] = useState(0);
  const [pricingFilters, setPricingFilters] = useState({
    hotel: "",
    stars: "",
    dateFrom: "",
    dateTo: "",
    room: "",
    board: "",
    price: "",
  });
  const [pricingSearchVersion, setPricingSearchVersion] = useState(0);
  const [revenueFilters, setRevenueFilters] = useState({ hotel: "", dateFrom: "", dateTo: "" });
  const [revenueSearchVersion, setRevenueSearchVersion] = useState(0);
  const [activePricingKpi, setActivePricingKpi] = useState("total_hotels");
  const [payload, setPayload] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const activeModuleLabel = useMemo(
    () => MODULES.find((item) => item.key === module)?.label || module,
    [module]
  );

  const loadData = useCallback(async () => {
    if (!isLoggedIn) return;
    setError("");
    const hotelQuery = search.trim() ? `?hotel=${encodeURIComponent(search.trim())}` : "";
    const next = {};

    if (module === "smart") {
      next.smart = await getJson(`/smart-tasks/${destination}`);
    } else if (module === "dashboard") {
      const params = [];
      if (dashboardFilters.hotel.trim()) params.push(`hotel=${encodeURIComponent(dashboardFilters.hotel.trim())}`);
      if (dashboardFilters.dateFrom.trim()) params.push(`date_from=${encodeURIComponent(dashboardFilters.dateFrom.trim())}`);
      if (dashboardFilters.dateTo.trim()) params.push(`date_to=${encodeURIComponent(dashboardFilters.dateTo.trim())}`);
      params.push("kpi=total_hotels");
      params.push("limit=20");
      const query = `?${params.join("&")}`;
      const [pricingDashboard, hotels, contractSummary, inhouseSummary] = await Promise.all([
        getJson(`/pricing/${destination}/dashboard${query}`),
        getJson(`/hotels/${destination}`),
        getJson("/contract-situation/summary"),
        getJson("/inhouse/summary"),
      ]);
      next.pricingDashboard = pricingDashboard;
      next.hotels = hotels;
      next.contractSummary = contractSummary;
      next.inhouseSummary = inhouseSummary;
    } else if (module === "pricing") {
      const params = [];
      if (pricingFilters.hotel.trim()) params.push(`hotel=${encodeURIComponent(pricingFilters.hotel.trim())}`);
      if (pricingFilters.stars.trim()) params.push(`stars=${encodeURIComponent(pricingFilters.stars.trim())}`);
      if (pricingFilters.dateFrom.trim()) params.push(`date_from=${encodeURIComponent(pricingFilters.dateFrom.trim())}`);
      if (pricingFilters.dateTo.trim()) params.push(`date_to=${encodeURIComponent(pricingFilters.dateTo.trim())}`);
      if (pricingFilters.room.trim()) params.push(`room=${encodeURIComponent(pricingFilters.room.trim())}`);
      if (pricingFilters.board.trim()) params.push(`board=${encodeURIComponent(pricingFilters.board.trim())}`);
      if (pricingFilters.price.trim()) params.push(`price=${encodeURIComponent(pricingFilters.price.trim())}`);
      params.push("kpi=total_hotels");
      params.push("limit=220");
      const query = `?${params.join("&")}`;
      const [pricingDashboard, hotels] = await Promise.all([
        getJson(`/pricing/${destination}/dashboard${query}`),
        getJson(`/hotels/${destination}`),
      ]);
      next.pricingDashboard = pricingDashboard;
      next.hotels = hotels;
    } else if (module === "turnover") {
      const params = [];
      if (revenueFilters.hotel.trim()) params.push(`hotel=${encodeURIComponent(revenueFilters.hotel.trim())}`);
      if (revenueFilters.dateFrom.trim()) params.push(`date_from=${encodeURIComponent(revenueFilters.dateFrom.trim())}`);
      if (revenueFilters.dateTo.trim()) params.push(`date_to=${encodeURIComponent(revenueFilters.dateTo.trim())}`);
      const query = params.length ? `?${params.join("&")}` : "";
      const rowsQuery = params.length ? `${query}&limit=120` : "?limit=120";
      const [summary, rows, hotels] = await Promise.all([
        getJson(`/sales/${destination}/summary${query}`),
        getJson(`/sales/${destination}${rowsQuery}`),
        getJson(`/hotels/${destination}`),
      ]);
      next.summary = summary;
      next.rows = rows;
      next.hotels = hotels;
    } else if (module === "contracts") {
      const [summary, rows] = await Promise.all([
        getJson("/contract-situation/summary"),
        getJson("/contract-situation?limit=160"),
      ]);
      next.summary = summary;
      next.rows = rows;
    } else if (module === "data") {
      next.data = await getJson("/data-center");
    } else if (module === "availability") {
      next.data = await getJson(`/availability/${destination}?limit=160`);
    }

    setPayload(next);
  }, [
    destination,
    isLoggedIn,
    module,
    search,
    dashboardFilters,
    dashboardSearchVersion,
    pricingFilters,
    pricingSearchVersion,
    revenueFilters,
    revenueSearchVersion,
  ]);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadData()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [loadData]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadData()
      .catch((err) => setError(err.message))
      .finally(() => setRefreshing(false));
  }, [loadData]);

  const filteredRows = filterRows(payload.rows || [], search);
  const runPricingSearch = useCallback(() => {
    setPricingSearchVersion((value) => value + 1);
  }, []);
  const runDashboardSearch = useCallback(() => {
    setDashboardSearchVersion((value) => value + 1);
  }, []);
  const runRevenueSearch = useCallback(() => {
    setRevenueSearchVersion((value) => value + 1);
  }, []);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.page}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#f8d77a" />}
      >
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => setIsDrawerOpen(true)}>
            <Ionicons name="menu-outline" size={24} color="#dbe3ea" />
          </Pressable>
          <View>
            <Text style={styles.brand}>Revenue Control</Text>
            <Text style={styles.subtitle}>{activeModuleLabel} • connected to web system</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconButton} onPress={refresh}>
              <Ionicons name="refresh-outline" size={22} color="#f8d77a" />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={22} color="#dbe3ea" />
            </Pressable>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {DESTINATIONS.map((item) => (
            <Pill key={item.key} active={destination === item.key} label={item.label} onPress={() => setDestination(item.key)} />
          ))}
        </ScrollView>

        {module !== "pricing" && module !== "dashboard" && module !== "turnover" && module !== "contracts" && (
          <View style={styles.searchPanel}>
            <Text style={styles.inputLabel}>{activeModuleLabel} Search</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search hotel, room, operator, status..."
              placeholderTextColor="#718397"
              style={styles.input}
            />
          </View>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#f8d77a" size="large" />
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>API connection failed</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorText}>Make sure the API is running on {API_BASE_URL}</Text>
          </View>
        ) : (
          <>
            {module === "smart" && <SmartTasksView data={payload.smart} />}
            {module === "dashboard" && (
              <DashboardView
                pricingDashboard={payload.pricingDashboard}
                contractSummary={payload.contractSummary}
                inhouseSummary={payload.inhouseSummary}
                hotelOptions={payload.hotels?.hotels || []}
                filters={dashboardFilters}
                setFilters={setDashboardFilters}
                onSearch={runDashboardSearch}
                onClear={() => {
                  setDashboardFilters({ hotel: "", dateFrom: "", dateTo: "" });
                  setDashboardSearchVersion((value) => value + 1);
                }}
              />
            )}
            {module === "pricing" && (
              <PricingView
                dashboard={payload.pricingDashboard}
                hotelOptions={payload.hotels?.hotels || []}
                destination={destination}
                filters={pricingFilters}
                setFilters={setPricingFilters}
                onSearch={runPricingSearch}
                onClear={() => {
                  setPricingFilters({ hotel: "", stars: "", dateFrom: "", dateTo: "", room: "", board: "", price: "" });
                  setActivePricingKpi("total_hotels");
                  setPricingSearchVersion((value) => value + 1);
                }}
              />
            )}
            {module === "turnover" && (
              <TurnoverView
                summary={payload.summary}
                rows={payload.rows || []}
                destination={destination}
                hotelOptions={payload.hotels?.hotels || []}
                filters={revenueFilters}
                setFilters={setRevenueFilters}
                onSearch={runRevenueSearch}
                onClear={() => {
                  setRevenueFilters({ hotel: "", dateFrom: "", dateTo: "" });
                  setRevenueSearchVersion((value) => value + 1);
                }}
              />
            )}
            {module === "contracts" && <ContractSituationView summary={payload.summary} rows={filteredRows} destination={destination} />}
            {module === "data" && <DataCenterView data={payload.data} />}
            {module === "availability" && <AvailabilityView data={payload.data} />}
          </>
        )}
      </ScrollView>
      <View style={styles.bottomNav}>
        {MAIN_TABS.map((item) => (
          <BottomTab
            key={item.key}
            active={module === item.key}
            label={item.label}
            icon={TAB_ICONS[item.key]}
            onPress={() => setModule(item.key)}
          />
        ))}
      </View>
      {isDrawerOpen && (
        <DrawerMenu
          activeModule={module}
          onClose={() => setIsDrawerOpen(false)}
          onNavigate={(nextModule) => {
            setModule(nextModule);
            setIsDrawerOpen(false);
          }}
          onLogout={() => {
            setIsDrawerOpen(false);
            setIsLoggedIn(false);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginExactSafeArea: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  loginExactFrame: {
    height: "100%",
    maxHeight: 1096,
    maxWidth: Platform.OS === "web" ? 430 : undefined,
    aspectRatio: 518 / 1096,
    alignSelf: "center",
  },
  loginExactImage: {
    width: "100%",
    height: "100%",
  },
  loginExactInput: {
    position: "absolute",
    left: "20%",
    width: "63%",
    height: "4.7%",
    color: "#eef4f8",
    fontFamily: APP_FONT,
    fontSize: 15,
    fontWeight: "400",
    paddingVertical: 0,
    outlineStyle: "none",
    backgroundColor: "transparent",
  },
  loginExactUsername: {
    top: "50.2%",
  },
  loginExactPassword: {
    top: "60.3%",
  },
  loginExactEye: {
    position: "absolute",
    left: "81.5%",
    top: "61.1%",
    width: "7%",
    height: "3.7%",
  },
  loginExactRemember: {
    position: "absolute",
    left: "9.3%",
    top: "67%",
    width: "5%",
    height: "2.5%",
    alignItems: "center",
    justifyContent: "center",
  },
  loginExactError: {
    position: "absolute",
    left: "9.5%",
    top: "70.1%",
    width: "81%",
    color: "#ffb3a8",
    fontFamily: APP_FONT,
    fontSize: 12,
    textAlign: "center",
  },
  loginExactButton: {
    position: "absolute",
    left: "9.3%",
    top: "71.2%",
    width: "82.5%",
    height: "5.7%",
  },
  loginExactFace: {
    position: "absolute",
    left: "9.2%",
    top: "81.9%",
    width: "39.8%",
    height: "10.6%",
  },
  loginExactFingerprint: {
    position: "absolute",
    left: "51.4%",
    top: "81.9%",
    width: "39.9%",
    height: "10.6%",
  },
  loginSafeArea: {
    flex: 1,
    backgroundColor: "#f4efe5",
    alignItems: "center",
  },
  loginScene: {
    flex: 1,
    width: "100%",
    maxWidth: Platform.OS === "web" ? 430 : undefined,
    backgroundColor: "#f4efe5",
    overflow: "hidden",
  },
  loginSky: {
    minHeight: 330,
    alignItems: "center",
    paddingTop: 28,
    paddingHorizontal: 22,
    backgroundColor: "#fbfaf7",
  },
  loginBell: {
    position: "absolute",
    right: 24,
    top: 28,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loginLogo: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "#d8aa43",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 10,
  },
  loginLogoText: {
    fontFamily: APP_FONT,
    color: "#d8aa43",
    fontSize: 21,
    fontWeight: "300",
  },
  loginBrand: {
    fontFamily: APP_FONT,
    color: "#172635",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 28,
  },
  loginWelcome: {
    fontFamily: APP_FONT,
    color: "#172635",
    fontSize: 18,
    fontWeight: "700",
  },
  loginSub: {
    fontFamily: APP_FONT,
    color: "#465566",
    fontSize: 12,
    marginTop: 4,
  },
  loginWater: {
    flex: 1,
    marginTop: -72,
    backgroundColor: "#132332",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 34,
    paddingHorizontal: 18,
  },
  loginPanel: {
    width: "100%",
  },
  loginLabel: {
    fontFamily: APP_FONT,
    color: "#e7eef5",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10,
  },
  loginInput: {
    fontFamily: APP_FONT,
    height: 42,
    borderRadius: 7,
    backgroundColor: "#f7fafc",
    color: "#172635",
    paddingHorizontal: 12,
    fontSize: 13,
    outlineStyle: "none",
  },
  loginPasswordWrap: {
    height: 42,
    borderRadius: 7,
    backgroundColor: "#f7fafc",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
  },
  loginPasswordInput: {
    fontFamily: APP_FONT,
    flex: 1,
    color: "#172635",
    fontSize: 13,
    outlineStyle: "none",
  },
  loginEye: {
    width: 38,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  loginOptions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  loginRemember: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  loginCheck: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#d8aa43",
    alignItems: "center",
    justifyContent: "center",
  },
  loginCheckActive: {
    backgroundColor: "#d8aa43",
  },
  loginOptionText: {
    fontFamily: APP_FONT,
    color: "#e7eef5",
    fontSize: 11,
  },
  loginForgot: {
    fontFamily: APP_FONT,
    color: "#d8aa43",
    fontSize: 11,
  },
  loginError: {
    fontFamily: APP_FONT,
    color: "#ffb3a8",
    fontSize: 12,
    marginTop: 10,
  },
  loginButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: "#d8aa43",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  loginButtonText: {
    fontFamily: APP_FONT,
    color: "#172635",
    fontSize: 14,
    fontWeight: "700",
  },
  loginDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 18,
  },
  loginDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(231, 238, 245, 0.18)",
  },
  loginDividerText: {
    fontFamily: APP_FONT,
    color: "#e7eef5",
    fontSize: 11,
  },
  loginBiometricRow: {
    flexDirection: "row",
    gap: 12,
  },
  loginBioButton: {
    flex: 1,
    height: 58,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(231, 238, 245, 0.13)",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  loginBioText: {
    fontFamily: APP_FONT,
    color: "#e7eef5",
    fontSize: 11,
  },
  loginFooter: {
    fontFamily: APP_FONT,
    color: "#e7eef5",
    textAlign: "center",
    fontSize: 11,
    marginTop: 22,
  },
  drawerOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 50,
    flexDirection: "row",
  },
  drawerBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(7, 12, 18, 0.36)",
  },
  drawerPanel: {
    width: "72%",
    maxWidth: 310,
    marginTop: 10,
    marginLeft: 10,
    borderRadius: 16,
    backgroundColor: "#111a26",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 18,
    shadowColor: "#000000",
    shadowOpacity: 0.32,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  drawerProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  drawerAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#d8aa43",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerAvatarText: {
    fontFamily: APP_FONT,
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },
  drawerName: {
    fontFamily: APP_FONT,
    color: "#f4f7fb",
    fontSize: 15,
    fontWeight: "800",
  },
  drawerRole: {
    fontFamily: APP_FONT,
    color: "#aab3bf",
    fontSize: 12,
    marginTop: 3,
    fontWeight: "500",
  },
  drawerDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginVertical: 16,
  },
  drawerItems: {
    gap: 8,
  },
  drawerItem: {
    minHeight: 50,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 6,
  },
  drawerItemActive: {
    backgroundColor: "#17253a",
    borderWidth: 1,
    borderColor: "rgba(216, 170, 67, 0.10)",
  },
  drawerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerIconBoxActive: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  drawerItemText: {
    fontFamily: APP_FONT,
    color: "#f4f7fb",
    fontSize: 15,
    fontWeight: "700",
  },
  drawerItemTextActive: {
    color: "#d8aa43",
  },
  drawerLogout: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 6,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f1e8",
  },
  page: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 430 : undefined,
    alignSelf: "center",
    padding: 16,
    paddingBottom: 104,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(27, 36, 48, 0.08)",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontFamily: APP_FONT,
    color: "#1b2430",
    fontSize: 24,
    fontWeight: "300",
  },
  subtitle: {
    fontFamily: APP_FONT,
    color: "#7b8794",
    fontSize: 13,
    fontWeight: "300",
    marginTop: 3,
  },
  refreshButton: {
    minWidth: 96,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(248, 215, 122, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17, 34, 51, 0.78)",
  },
  refreshText: {
    fontFamily: APP_FONT,
    color: "#f8d77a",
    fontWeight: "300",
  },
  bottomNav: {
    position: "absolute",
    left: Platform.OS === "web" ? "50%" : 10,
    right: Platform.OS === "web" ? undefined : 10,
    bottom: 10,
    width: Platform.OS === "web" ? "calc(100% - 20px)" : undefined,
    maxWidth: 430,
    transform: Platform.OS === "web" ? [{ translateX: -215 }] : [],
    minHeight: 66,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(116, 143, 170, 0.28)",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  bottomTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  bottomTabText: {
    fontFamily: APP_FONT,
    color: "#7e8b99",
    fontSize: 11,
    fontWeight: "300",
  },
  bottomTabTextActive: {
    color: "#d8aa43",
  },
  pillRow: {
    gap: 8,
    paddingVertical: 6,
  },
  pill: {
    height: 42,
    minWidth: 132,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(27, 36, 48, 0.08)",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
  },
  pillActive: {
    borderColor: "#d8aa43",
    backgroundColor: "#f3dfad",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e6e0d4",
    backgroundColor: "#d5d9df",
  },
  dotActive: {
    backgroundColor: "#d8aa43",
    borderColor: "#fff8e5",
  },
  pillText: {
    fontFamily: APP_FONT,
    color: "#1b2430",
    fontWeight: "300",
    fontSize: 13,
  },
  pillTextActive: {
    color: "#1b2430",
  },
  searchPanel: {
    marginTop: 8,
    marginBottom: 14,
  },
  pricingSearchBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(27, 36, 48, 0.08)",
    backgroundColor: "#ffffff",
    padding: 14,
    marginBottom: 14,
  },
  searchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  searchField: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 150,
  },
  searchFieldWide: {
    flexGrow: 2,
    flexBasis: "62%",
    minWidth: 230,
    position: "relative",
  },
  suggestionBox: {
    position: "absolute",
    top: 74,
    left: 0,
    right: 0,
    zIndex: 30,
    maxHeight: 88,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(27, 36, 48, 0.08)",
    backgroundColor: "#ffffff",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.10,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  suggestionItem: {
    minHeight: 30,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(116, 143, 170, 0.16)",
  },
  suggestionText: {
    fontFamily: APP_FONT,
    color: "#1b2430",
    fontWeight: "300",
  },
  searchActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    marginBottom: 2,
  },
  searchButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#d8aa43",
    borderWidth: 1,
    borderColor: "#d8aa43",
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonText: {
    fontFamily: APP_FONT,
    color: "#ffffff",
    fontWeight: "300",
  },
  clearButton: {
    minWidth: 96,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(27, 36, 48, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  clearButtonText: {
    fontFamily: APP_FONT,
    color: "#d8aa43",
    fontWeight: "300",
  },
  contractClearButton: {
    flexGrow: 0,
    minWidth: 120,
    alignSelf: "flex-start",
  },
  inputLabel: {
    fontFamily: APP_FONT,
    color: "#1b2430",
    fontSize: 13,
    fontWeight: "300",
    marginBottom: 6,
  },
  input: {
    fontFamily: APP_FONT,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(27, 36, 48, 0.08)",
    backgroundColor: "#f8f8f6",
    color: "#1b2430",
    paddingHorizontal: 14,
    fontWeight: "300",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  dashboardTitle: {
    fontFamily: APP_FONT,
    color: "#1b2430",
    fontSize: 22,
    fontWeight: "300",
    marginBottom: 12,
  },
  homeIntro: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  greetingText: {
    fontFamily: APP_FONT,
    color: "#1b2430",
    fontSize: 15,
    fontWeight: "300",
  },
  greetingSub: {
    fontFamily: APP_FONT,
    color: "#8a94a1",
    fontSize: 12,
    fontWeight: "300",
    marginTop: 3,
  },
  destinationChip: {
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(27, 36, 48, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  destinationChipText: {
    fontFamily: APP_FONT,
    color: "#1b2430",
    fontSize: 12,
    fontWeight: "300",
  },
  homeKpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  mobileScreenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  mobileScreenTitle: {
    fontFamily: APP_FONT,
    color: "#1b2430",
    fontSize: 18,
    fontWeight: "300",
  },
  roundIconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(27, 36, 48, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(27, 36, 48, 0.08)",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchBarInput: {
    fontFamily: APP_FONT,
    flex: 1,
    color: "#1b2430",
    fontWeight: "300",
    outlineStyle: "none",
  },
  pricingTopSuggestions: {
    marginTop: -4,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(27, 36, 48, 0.08)",
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  pricingFiltersBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(27, 36, 48, 0.08)",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
    marginBottom: 14,
  },
  pricingFiltersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pricingFilterField: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 142,
    position: "relative",
    zIndex: 4,
  },
  pricingFilterFieldFull: {
    flexBasis: "auto",
    width: "100%",
    minWidth: 0,
    alignSelf: "stretch",
    marginBottom: 10,
  },
  revenueDateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  filterChipsRow: {
    gap: 8,
    paddingBottom: 10,
  },
  filterChip: {
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(27, 36, 48, 0.08)",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipText: {
    fontFamily: APP_FONT,
    color: "#1b2430",
    fontSize: 11,
    fontWeight: "300",
  },
  pricingKpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  kpiSectionHeader: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(27, 36, 48, 0.08)",
    backgroundColor: "#ffffff",
    justifyContent: "center",
    paddingHorizontal: 14,
    marginTop: 10,
    marginBottom: 8,
  },
  kpiSectionTitle: {
    fontFamily: APP_FONT,
    color: "#d8bd69",
    fontSize: 16,
    fontWeight: "300",
    textTransform: "uppercase",
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  kpiTile: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 165,
    minHeight: 86,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(27, 36, 48, 0.08)",
    backgroundColor: "#ffffff",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  kpiTileActive: {
    borderColor: "rgba(248, 215, 122, 0.7)",
    backgroundColor: "#fff6df",
  },
  kpiIcon: {
    width: 42,
    height: 42,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#86b96e",
    alignItems: "center",
    justifyContent: "center",
  },
  kpiIconRed: {
    borderColor: "#ff6f67",
  },
  kpiIconBlue: {
    borderColor: "#6ca0ff",
  },
  kpiIconText: {
    fontFamily: APP_FONT,
    color: "#f8d77a",
    fontWeight: "300",
    fontSize: 17,
  },
  kpiBody: {
    flex: 1,
    minWidth: 0,
  },
  noticeBar: {
    minHeight: 42,
    borderRadius: 7,
    backgroundColor: "rgba(31, 51, 75, 0.96)",
    justifyContent: "center",
    paddingHorizontal: 12,
    marginTop: -2,
    marginBottom: 10,
  },
  noticeText: {
    fontFamily: APP_FONT,
    color: "#d5dee8",
    fontWeight: "300",
  },
  statCard: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 150,
    minHeight: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(27, 36, 48, 0.08)",
    backgroundColor: "#ffffff",
    padding: 13,
    justifyContent: "space-between",
  },
  statLabel: {
    fontFamily: APP_FONT,
    color: "#7b8794",
    fontWeight: "300",
  },
  statValue: {
    fontFamily: APP_FONT,
    color: "#1b2430",
    fontSize: 25,
    fontWeight: "300",
  },
  statSub: {
    fontFamily: APP_FONT,
    color: "#9aa3ad",
    fontSize: 12,
    fontWeight: "300",
  },
  goldText: {
    color: "#d8aa43",
  },
  section: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(27, 36, 48, 0.08)",
    backgroundColor: "#ffffff",
    padding: 14,
    marginTop: 10,
  },
  sectionTitle: {
    fontFamily: APP_FONT,
    color: "#1b2430",
    fontSize: 16,
    fontWeight: "300",
    marginBottom: 8,
  },
  infoRow: {
    minHeight: 58,
    borderTopWidth: 1,
    borderTopColor: "rgba(27, 36, 48, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  infoBody: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
  },
  infoTitle: {
    fontFamily: APP_FONT,
    color: "#1b2430",
    fontWeight: "300",
    fontSize: 14,
  },
  infoSub: {
    fontFamily: APP_FONT,
    color: "#7b8794",
    fontWeight: "300",
    marginTop: 3,
    fontSize: 12,
  },
  infoRight: {
    fontFamily: APP_FONT,
    color: "#d8aa43",
    fontWeight: "300",
    maxWidth: 110,
  },
  pricingResultCard: {
    borderTopWidth: 1,
    borderTopColor: "rgba(116, 143, 170, 0.18)",
    paddingVertical: 12,
  },
  pricingHotelName: {
    fontFamily: APP_FONT,
    color: "#f8d77a",
    fontSize: 16,
    fontWeight: "300",
    marginBottom: 10,
  },
  pricingResultGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pricingResultItem: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 145,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(116, 143, 170, 0.22)",
    backgroundColor: "rgba(17, 34, 51, 0.56)",
    padding: 10,
  },
  pricingResultLabel: {
    fontFamily: APP_FONT,
    color: "#8fa1b2",
    fontSize: 11,
    fontWeight: "300",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  pricingResultValue: {
    fontFamily: APP_FONT,
    color: "#e9eef4",
    fontSize: 14,
    fontWeight: "300",
  },
  pricingListCard: {
    minHeight: 94,
    borderTopWidth: 1,
    borderTopColor: "rgba(27, 36, 48, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
  },
  hotelThumb: {
    width: 58,
    height: 58,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(216, 170, 67, 0.34)",
    backgroundColor: "rgba(216, 170, 67, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  pricingListBody: {
    flex: 1,
    minWidth: 0,
  },
  pricingListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  pricingListHotel: {
    fontFamily: APP_FONT,
    flex: 1,
    color: "#1b2430",
    fontSize: 14,
    fontWeight: "300",
  },
  ratingText: {
    fontFamily: APP_FONT,
    color: "#d8aa43",
    fontSize: 10,
    fontWeight: "300",
  },
  pricingListMeta: {
    fontFamily: APP_FONT,
    color: "#95a5b6",
    fontSize: 11,
    fontWeight: "300",
    marginTop: 4,
  },
  priceMiniGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 8,
  },
  miniLabel: {
    fontFamily: APP_FONT,
    color: "#7f90a3",
    fontSize: 10,
    fontWeight: "300",
  },
  miniValue: {
    fontFamily: APP_FONT,
    color: "#1b2430",
    fontSize: 12,
    fontWeight: "300",
    marginTop: 2,
  },
  statusBadge: {
    minWidth: 58,
    borderRadius: 999,
    backgroundColor: "rgba(216, 170, 67, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(216, 170, 67, 0.34)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: "center",
  },
  statusBadgeText: {
    fontFamily: APP_FONT,
    color: "#d8aa43",
    fontSize: 9,
    fontWeight: "300",
  },
  inhouseCardsWrap: {
    gap: 10,
    marginBottom: 10,
  },
  inhouseCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(116, 143, 170, 0.34)",
    backgroundColor: "rgba(15, 30, 46, 0.9)",
    padding: 12,
  },
  inhouseCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  inhouseHotelBlock: {
    flex: 1,
    minWidth: 0,
  },
  inhouseHotelName: {
    fontFamily: APP_FONT,
    color: "#f8d77a",
    fontSize: 16,
    fontWeight: "300",
  },
  inhouseMeta: {
    fontFamily: APP_FONT,
    color: "#95a5b6",
    fontSize: 12,
    fontWeight: "300",
    marginTop: 4,
  },
  inhouseScoreBox: {
    minWidth: 86,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(248, 215, 122, 0.34)",
    backgroundColor: "rgba(248, 215, 122, 0.08)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  inhouseScore: {
    fontFamily: APP_FONT,
    color: "#f8d77a",
    fontSize: 20,
    fontWeight: "300",
  },
  inhouseScoreLabel: {
    fontFamily: APP_FONT,
    color: "#9fb0bf",
    fontSize: 10,
    fontWeight: "300",
    marginTop: 2,
  },
  inhouseProgressTrack: {
    height: 10,
    borderRadius: 99,
    backgroundColor: "rgba(116, 143, 170, 0.18)",
    overflow: "hidden",
    marginTop: 12,
  },
  inhouseProgressFill: {
    height: "100%",
    borderRadius: 99,
  },
  inhouseProgressGood: {
    backgroundColor: "#84c988",
  },
  inhouseProgressBad: {
    backgroundColor: "#ff6f67",
  },
  inhouseMonthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  inhouseMonthBox: {
    flexGrow: 1,
    flexBasis: "18%",
    minWidth: 88,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(116, 143, 170, 0.24)",
    backgroundColor: "rgba(17, 34, 51, 0.62)",
    padding: 9,
  },
  inhouseMonthLabel: {
    fontFamily: APP_FONT,
    color: "#f8d77a",
    fontSize: 11,
    fontWeight: "300",
    marginBottom: 4,
  },
  inhouseMonthValue: {
    fontFamily: APP_FONT,
    color: "#e9eef4",
    fontSize: 14,
    fontWeight: "300",
  },
  inhouseMonthDiff: {
    fontFamily: APP_FONT,
    fontSize: 11,
    fontWeight: "300",
    marginTop: 3,
  },
  positiveText: {
    color: "#91d49a",
  },
  negativeText: {
    color: "#e97b7b",
  },
  taskCard: {
    borderTopWidth: 1,
    borderTopColor: "rgba(116, 143, 170, 0.2)",
    paddingVertical: 12,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  taskPriority: {
    fontFamily: APP_FONT,
    color: "#f8d77a",
    fontWeight: "300",
    fontSize: 12,
  },
  criticalText: {
    color: "#ff6f67",
  },
  taskScore: {
    fontFamily: APP_FONT,
    color: "#f8d77a",
    fontWeight: "300",
    fontSize: 12,
  },
  taskTitle: {
    fontFamily: APP_FONT,
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "300",
    marginTop: 8,
  },
  taskLine: {
    fontFamily: APP_FONT,
    color: "#d3dce5",
    fontWeight: "300",
    marginTop: 6,
  },
  reportGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  reportButton: {
    flexGrow: 1,
    flexBasis: "47%",
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(248, 215, 122, 0.35)",
    backgroundColor: "rgba(248, 215, 122, 0.08)",
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  reportButton_excel: {
    borderColor: "rgba(21, 115, 71, 0.28)",
    backgroundColor: "rgba(21, 115, 71, 0.08)",
  },
  reportButton_pdf: {
    borderColor: "rgba(192, 57, 43, 0.28)",
    backgroundColor: "rgba(192, 57, 43, 0.08)",
  },
  reportButtonText: {
    fontFamily: APP_FONT,
    color: "#f8d77a",
    fontWeight: "300",
  },
  reportButtonText_excel: {
    color: "#157347",
  },
  reportButtonText_pdf: {
    color: "#c0392b",
  },
  contractReportBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    marginBottom: 14,
  },
  mailButton: {
    flexGrow: 1,
    flexBasis: "100%",
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(216, 170, 67, 0.28)",
    backgroundColor: "rgba(216, 170, 67, 0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  mailButtonText: {
    fontFamily: APP_FONT,
    color: "#1b2430",
    fontWeight: "400",
  },
  mailPanel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(27, 36, 48, 0.08)",
    backgroundColor: "#ffffff",
    padding: 12,
    gap: 10,
    marginTop: 2,
    marginBottom: 14,
  },
  savedMailRow: {
    gap: 8,
    paddingVertical: 2,
  },
  savedMailChip: {
    minHeight: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(216, 170, 67, 0.25)",
    backgroundColor: "rgba(216, 170, 67, 0.08)",
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  savedMailText: {
    fontFamily: APP_FONT,
    color: "#1b2430",
    fontSize: 12,
  },
  mailFormatRow: {
    flexDirection: "row",
    gap: 8,
  },
  mailFormatButton: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(27, 36, 48, 0.08)",
    backgroundColor: "#f8f8f6",
    alignItems: "center",
    justifyContent: "center",
  },
  mailFormatButtonActiveExcel: {
    borderColor: "rgba(21, 115, 71, 0.35)",
    backgroundColor: "rgba(21, 115, 71, 0.10)",
  },
  mailFormatButtonActivePdf: {
    borderColor: "rgba(192, 57, 43, 0.35)",
    backgroundColor: "rgba(192, 57, 43, 0.10)",
  },
  mailFormatText: {
    fontFamily: APP_FONT,
    color: "#718397",
    fontWeight: "400",
  },
  mailFormatTextExcel: {
    color: "#157347",
  },
  mailFormatTextPdf: {
    color: "#c0392b",
  },
  sendMailConfirm: {
    height: 42,
    borderRadius: 10,
    backgroundColor: "#d8aa43",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    minHeight: 74,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(116, 143, 170, 0.18)",
  },
  emptyText: {
    fontFamily: APP_FONT,
    color: "#9fb0bf",
    fontWeight: "300",
  },
  loadingBox: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: APP_FONT,
    color: "#aeb9c5",
    fontWeight: "300",
  },
  errorBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 99, 99, 0.45)",
    backgroundColor: "rgba(80, 20, 24, 0.35)",
    padding: 14,
  },
  errorTitle: {
    fontFamily: APP_FONT,
    color: "#ff9a9a",
    fontSize: 16,
    fontWeight: "300",
    marginBottom: 6,
  },
  errorText: {
    fontFamily: APP_FONT,
    color: "#ffd0d0",
    fontWeight: "300",
    marginTop: 3,
  },
});

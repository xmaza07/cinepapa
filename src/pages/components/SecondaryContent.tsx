
import { useState, useEffect } from 'react';
import ContentRow from '@/components/ContentRow';
import { Media } from '@/utils/types';
import {
  getRecentlyAdded,
  getMostWatchedThisWeek,
  getAwardWinners,
  getCriticallyAcclaimed,
  getEditorsPicks,
  getHiddenGems,
  getClassics,
  getBasedOnTrueStories,
  getActionMovies,
  getComedyMovies,
  getDramaMovies,
  getThrillerMovies,
  getSciFiMovies,
  getHorrorMovies,
  getRomanceMovies,
  getAnimationMovies,
  getFamilyMovies,
  getDocumentaryMovies,
  getMysteryMovies,
  getFantasyMovies,
  getBingeWorthySeries,
  getMoviesForKids,
  getHollywoodMovies,
  getBollywoodMovies,
  getKoreanDramas,
  getJapaneseAnime,
  getEuropeanCinema,
  getYouTubeOriginals,
  getHBOMax,
  getPeacock,
  getCrunchyroll
} from '@/utils/api';

const SecondaryContent = () => {
  // Thematic/Curated
  const [recentlyAdded, setRecentlyAdded] = useState<Media[]>([]);
  const [mostWatched, setMostWatched] = useState<Media[]>([]);
  const [awardWinners, setAwardWinners] = useState<Media[]>([]);
  const [criticallyAcclaimed, setCriticallyAcclaimed] = useState<Media[]>([]);
  const [editorsPicks, setEditorsPicks] = useState<Media[]>([]);
  const [hiddenGems, setHiddenGems] = useState<Media[]>([]);
  const [classics, setClassics] = useState<Media[]>([]);
  const [basedOnTrueStories, setBasedOnTrueStories] = useState<Media[]>([]);
  // Genre-Based
  const [actionMovies, setActionMovies] = useState<Media[]>([]);
  const [comedyMovies, setComedyMovies] = useState<Media[]>([]);
  const [dramaMovies, setDramaMovies] = useState<Media[]>([]);
  const [thrillerMovies, setThrillerMovies] = useState<Media[]>([]);
  const [sciFiMovies, setSciFiMovies] = useState<Media[]>([]);
  const [horrorMovies, setHorrorMovies] = useState<Media[]>([]);
  const [romanceMovies, setRomanceMovies] = useState<Media[]>([]);
  const [animationMovies, setAnimationMovies] = useState<Media[]>([]);
  const [familyMovies, setFamilyMovies] = useState<Media[]>([]);
  const [documentaryMovies, setDocumentaryMovies] = useState<Media[]>([]);
  const [mysteryMovies, setMysteryMovies] = useState<Media[]>([]);
  const [fantasyMovies, setFantasyMovies] = useState<Media[]>([]);
  // Binge/For Kids
  const [bingeSeries, setBingeSeries] = useState<Media[]>([]);
  const [moviesForKids, setMoviesForKids] = useState<Media[]>([]);
  // Regional/Language
  const [hollywoodMovies, setHollywoodMovies] = useState<Media[]>([]);
  const [bollywoodMovies, setBollywoodMovies] = useState<Media[]>([]);
  const [koreanDramas, setKoreanDramas] = useState<Media[]>([]);
  const [japaneseAnime, setJapaneseAnime] = useState<Media[]>([]);
  const [europeanCinema, setEuropeanCinema] = useState<Media[]>([]);
  // Platform/Provider
  const [youTubeOriginals, setYouTubeOriginals] = useState<Media[]>([]);
  const [hboMax, setHBOMax] = useState<Media[]>([]);
  const [peacock, setPeacock] = useState<Media[]>([]);
  const [crunchyroll, setCrunchyroll] = useState<Media[]>([]);

  useEffect(() => {
    const fetchAllContent = async () => {
      try {
        // Thematic/Curated
        const [recent, mostWatched, awards, critics, editors, hidden, classic, trueStories] = await Promise.all([
          getRecentlyAdded(),
          getMostWatchedThisWeek(),
          getAwardWinners(),
          getCriticallyAcclaimed(),
          getEditorsPicks(),
          getHiddenGems(),
          getClassics(),
          getBasedOnTrueStories()
        ]);
        setRecentlyAdded(recent);
        setMostWatched(mostWatched);
        setAwardWinners(awards);
        setCriticallyAcclaimed(critics);
        setEditorsPicks(editors);
        setHiddenGems(hidden);
        setClassics(classic);
        setBasedOnTrueStories(trueStories);

        // Genre-Based
        const [action, comedy, drama, thriller, scifi, horror, romance, animation, family, documentary, mystery, fantasy] = await Promise.all([
          getActionMovies(),
          getComedyMovies(),
          getDramaMovies(),
          getThrillerMovies(),
          getSciFiMovies(),
          getHorrorMovies(),
          getRomanceMovies(),
          getAnimationMovies(),
          getFamilyMovies(),
          getDocumentaryMovies(),
          getMysteryMovies(),
          getFantasyMovies()
        ]);
        setActionMovies(action);
        setComedyMovies(comedy);
        setDramaMovies(drama);
        setThrillerMovies(thriller);
        setSciFiMovies(scifi);
        setHorrorMovies(horror);
        setRomanceMovies(romance);
        setAnimationMovies(animation);
        setFamilyMovies(family);
        setDocumentaryMovies(documentary);
        setMysteryMovies(mystery);
        setFantasyMovies(fantasy);

        // Binge/For Kids
        const [binge, kids] = await Promise.all([
          getBingeWorthySeries(),
          getMoviesForKids()
        ]);
        setBingeSeries(binge);
        setMoviesForKids(kids);

        // Regional/Language
        const [hollywood, bollywood, korean, anime, euro] = await Promise.all([
          getHollywoodMovies(),
          getBollywoodMovies(),
          getKoreanDramas(),
          getJapaneseAnime(),
          getEuropeanCinema()
        ]);
        setHollywoodMovies(hollywood);
        setBollywoodMovies(bollywood);
        setKoreanDramas(korean);
        setJapaneseAnime(anime);
        setEuropeanCinema(euro);

        // Platform/Provider
        const [yt, hbo, pea, crun] = await Promise.all([
          getYouTubeOriginals(),
          getHBOMax(),
          getPeacock(),
          getCrunchyroll()
        ]);
        setYouTubeOriginals(yt);
        setHBOMax(hbo);
        setPeacock(pea);
        setCrunchyroll(crun);
      } catch (error) {
        console.error('Error fetching homepage content:', error);
      }
    };
    fetchAllContent();
  }, []);

  return (
    <>
      {/* Thematic/Curated Rows */}
      {recentlyAdded.length > 0 && <ContentRow title="Recently Added" media={recentlyAdded} />}
      {mostWatched.length > 0 && <ContentRow title="Most Watched This Week" media={mostWatched} />}
      {awardWinners.length > 0 && <ContentRow title="Award Winners" media={awardWinners} />}
      {criticallyAcclaimed.length > 0 && <ContentRow title="Critically Acclaimed" media={criticallyAcclaimed} />}
      {editorsPicks.length > 0 && <ContentRow title="Editor's Picks" media={editorsPicks} />}
      {hiddenGems.length > 0 && <ContentRow title="Hidden Gems" media={hiddenGems} />}
      {classics.length > 0 && <ContentRow title="Classics" media={classics} />}
      {basedOnTrueStories.length > 0 && <ContentRow title="Based on True Stories" media={basedOnTrueStories} />}

      {/* Genre-Based Rows */}
      {actionMovies.length > 0 && <ContentRow title="Action" media={actionMovies} />}
      {comedyMovies.length > 0 && <ContentRow title="Comedy" media={comedyMovies} />}
      {dramaMovies.length > 0 && <ContentRow title="Drama" media={dramaMovies} />}
      {thrillerMovies.length > 0 && <ContentRow title="Thriller" media={thrillerMovies} />}
      {sciFiMovies.length > 0 && <ContentRow title="Sci-Fi" media={sciFiMovies} />}
      {horrorMovies.length > 0 && <ContentRow title="Horror" media={horrorMovies} />}
      {romanceMovies.length > 0 && <ContentRow title="Romance" media={romanceMovies} />}
      {animationMovies.length > 0 && <ContentRow title="Animation" media={animationMovies} />}
      {familyMovies.length > 0 && <ContentRow title="Family" media={familyMovies} />}
      {documentaryMovies.length > 0 && <ContentRow title="Documentary" media={documentaryMovies} />}
      {mysteryMovies.length > 0 && <ContentRow title="Mystery" media={mysteryMovies} />}
      {fantasyMovies.length > 0 && <ContentRow title="Fantasy" media={fantasyMovies} />}

      {/* Binge/For Kids */}
      {bingeSeries.length > 0 && <ContentRow title="Binge-Worthy Series" media={bingeSeries} />}
      {moviesForKids.length > 0 && <ContentRow title="Movies for Kids" media={moviesForKids} />}

      {/* Regional/Language Rows */}
      {hollywoodMovies.length > 0 && <ContentRow title="Hollywood" media={hollywoodMovies} />}
      {bollywoodMovies.length > 0 && <ContentRow title="Bollywood" media={bollywoodMovies} />}
      {koreanDramas.length > 0 && <ContentRow title="Korean Dramas" media={koreanDramas} />}
      {japaneseAnime.length > 0 && <ContentRow title="Japanese Anime" media={japaneseAnime} />}
      {europeanCinema.length > 0 && <ContentRow title="European Cinema" media={europeanCinema} />}

      {/* Platform/Provider Rows */}
      {youTubeOriginals.length > 0 && <ContentRow title="YouTube Originals" media={youTubeOriginals} />}
      {hboMax.length > 0 && <ContentRow title="HBO Max" media={hboMax} />}
      {peacock.length > 0 && <ContentRow title="Peacock" media={peacock} />}
      {crunchyroll.length > 0 && <ContentRow title="Crunchyroll" media={crunchyroll} />}
    </>
  );
};

export default SecondaryContent;

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update

from database.session import get_async_db, AsyncSessionLocal
from database.models.research import ResearchSession
from database.models.report import Report
from database.models.source import Source
from websocket.manager import ws_manager
from agents.manager import ManagerAgent
from schemas.research import ResearchCreate
from schemas.websocket import WSMessage
from utils.logger import logger

router = APIRouter(prefix="/ws", tags=["WebSocket"])


@router.websocket("/research")
async def websocket_research_endpoint(websocket: WebSocket, db: AsyncSession = Depends(get_async_db)):
    """
    WebSocket endpoint for real-time streaming of research progress, logs, and results.
    """
    await ws_manager.connect(websocket)
    manager = ManagerAgent()

    try:
        while True:
            data = await websocket.receive_json()
            logger.info(f"[WebSocket API] Received payload: {data}")

            try:
                payload = ResearchCreate(**data)
            except Exception as parse_err:
                await ws_manager.send_personal_message(
                    WSMessage(
                        event="error",
                        message=f"Invalid research payload format: {parse_err}"
                    ).model_dump(),
                    websocket
                )
                continue

            research_id = None
            async with AsyncSessionLocal() as session:
                try:
                    db_session = ResearchSession(
                        query=payload.query,
                        nature=payload.nature,
                        depth=payload.depth,
                        requirements=payload.requirements,
                        status="queued",
                        progress=0,
                        current_stage="queued"
                    )
                    session.add(db_session)
                    await session.commit()
                    await session.refresh(db_session)
                    research_id = db_session.id
                    logger.info(f"[WebSocket API] Created research session: {research_id}")
                    
                    # Notify client of the research_id
                    await ws_manager.send_personal_message(
                        WSMessage(
                            event="status",
                            stage="queued",
                            progress=0,
                            message=f"Research session created with ID: {research_id}",
                            data={"research_id": research_id}
                        ).model_dump(),
                        websocket
                    )
                except Exception as db_err:
                    logger.error(f"[WebSocket API] Failed to initialize session in DB: {db_err}")

            async def progress_cb(stage: str, progress: int, msg: str):
                event_data = WSMessage(
                    event="status",
                    stage=stage,
                    progress=progress,
                    message=msg,
                    data={"research_id": research_id} if research_id else None
                ).model_dump()
                await ws_manager.send_personal_message(event_data, websocket)

                if research_id:
                    async with AsyncSessionLocal() as session:
                        try:
                            stmt = (
                                update(ResearchSession)
                                .where(ResearchSession.id == research_id)
                                .values(
                                    status="processing",
                                    progress=progress,
                                    current_stage=stage
                                )
                            )
                            await session.execute(stmt)
                            await session.commit()
                        except Exception as update_err:
                            logger.error(f"[WebSocket API] Failed to update progress in DB: {update_err}")

            try:
                state = await manager.run_research_pipeline(
                    query=payload.query,
                    nature=payload.nature,
                    depth=payload.depth,
                    requirements=payload.requirements,
                    progress_callback=progress_cb
                )

                if research_id and state.get("final_report"):
                    async with AsyncSessionLocal() as session:
                        try:
                            fin = state["final_report"]
                            report_rec = Report(
                                research_id=research_id,
                                title=fin.get("title", payload.query),
                                summary=fin.get("summary"),
                                content_markdown=fin.get("content_markdown", ""),
                                content_html=fin.get("content_html"),
                                bibliography=fin.get("bibliography", []),
                                word_count=fin.get("word_count", 0)
                            )
                            session.add(report_rec)

                            for src in state.get("sources", []):
                                db_src = Source(
                                    research_id=research_id,
                                    provider=src.provider,
                                    title=src.title,
                                    url=src.url,
                                    snippet=src.snippet,
                                    relevance_score=src.relevance_score
                                )
                                session.add(db_src)

                            stmt = (
                                update(ResearchSession)
                                .where(ResearchSession.id == research_id)
                                .values(
                                    status="completed",
                                    progress=100,
                                    current_stage="completed",
                                    title=fin.get("title", payload.query)
                                )
                            )
                            await session.execute(stmt)
                            await session.commit()
                            logger.info(f"[WebSocket API] Research session {research_id} and report saved successfully.")
                        except Exception as save_err:
                            logger.error(f"[WebSocket API] Failed to save report to DB: {save_err}")

                await ws_manager.send_personal_message(
                    WSMessage(
                        event="report",
                        stage="completed",
                        progress=100,
                        message="Deep research completed successfully.",
                        data=state.get("final_report")
                    ).model_dump(),
                    websocket
                )
            except Exception as pipeline_err:
                logger.error(f"[WebSocket API] Research pipeline error: {pipeline_err}")
                if research_id:
                    async with AsyncSessionLocal() as session:
                        try:
                            stmt = (
                                update(ResearchSession)
                                .where(ResearchSession.id == research_id)
                                .values(status="failed", current_stage="failed")
                            )
                            await session.execute(stmt)
                            await session.commit()
                        except Exception as update_err:
                            logger.error(f"[WebSocket API] Failed to mark session as failed in DB: {update_err}")

                await ws_manager.send_personal_message(
                    WSMessage(
                        event="error",
                        message=f"Pipeline execution error: {pipeline_err}"
                    ).model_dump(),
                    websocket
                )
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as exc:
        logger.error(f"[WebSocket API] Socket error: {exc}")
        ws_manager.disconnect(websocket)

